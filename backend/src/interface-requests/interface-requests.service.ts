import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Express } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { InterfaceRequest, IRStatus, IRPriority, Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { GcsService } from '../gcs/gcs.service';

@Injectable()
export class InterfaceRequestsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private realtimeGateway: RealtimeGateway,
    private gcsService: GcsService,
  ) {}

  async findAll(filters: {
    projectId?: string;
    status?: IRStatus;
    companyId?: string;
  }): Promise<InterfaceRequest[]> {
    const where: Prisma.InterfaceRequestWhereInput = {};
    
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.status) where.status = filters.status;
    if (filters.companyId) {
      where.OR = [
        { requestorCompanyId: filters.companyId },
        { responderCompanyId: filters.companyId },
      ];
    }

    return this.prisma.interfaceRequest.findMany({
      where,
      include: {
        requestorCompany: true,
        responderCompany: true,
        requestorUser: true,
        responderUser: true,
        assignedUser: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<any> {
    const ir = await this.prisma.interfaceRequest.findUnique({
      where: { id },
      include: {
        project: true,
        requestorCompany: true,
        responderCompany: true,
        requestorUser: true,
        responderUser: true,
        assignedUser: true,
        response: {
          include: { attachments: true },
        },
        workflowLogs: {
          include: { actor: true },
          orderBy: { timestamp: 'desc' },
        },
        attachments: true,
      },
    });

    if (!ir) throw new NotFoundException(`IR with ID ${id} not found`);

    if (ir.attachments) {
      ir.attachments = await this.signAttachmentUrls(ir.attachments);
    }

    if (ir.response && ir.response.attachments) {
      ir.response.attachments = await this.signAttachmentUrls(ir.response.attachments);
    }

    return ir;
  }

  async create(data: {
    title: string;
    description: string;
    priority: IRPriority;
    projectId: string;
    requestorCompanyId: string;
    responderCompanyId: string;
    requestorUserId: string;
    dueDate: Date;
    status?: IRStatus;
  }): Promise<InterfaceRequest> {
    // 1. Get company codes for IR Number
    const reqCompany = await this.prisma.company.findUnique({ where: { id: data.requestorCompanyId } });
    const resCompany = await this.prisma.company.findUnique({ where: { id: data.responderCompanyId } });

    if (!reqCompany || !resCompany) throw new BadRequestException('Invalid companies');

    // 2. Generate IR Number: IR-REQ-RES-XXXX
    const prefix = `IR-${reqCompany.code}-${resCompany.code}-`;
    const count = await this.prisma.interfaceRequest.count({
      where: { irNumber: { startsWith: prefix } },
    });
    const irNumber = `${prefix}${(count + 1).toString().padStart(4, '0')}`;

    // 3. Create IR
    const ir = await this.prisma.interfaceRequest.create({
      data: {
        ...data,
        irNumber,
        status: data.status || IRStatus.draft,
      },
    });

    // 4. Log initial action
    await this.logWorkflow(ir.id, 'Draft', 'Created', data.requestorUserId, 'IR created as draft');

    return ir;
  }

  async updateStatus(
    id: string,
    status: IRStatus,
    actorId: string,
    comment?: string,
    assignedUserId?: string,
  ): Promise<InterfaceRequest> {
    const ir = await this.prisma.interfaceRequest.findUnique({ where: { id } });
    if (!ir) throw new NotFoundException();

    await this.prisma.interfaceRequest.update({
      where: { id },
      data: {
        status,
        assignedUserId: assignedUserId || ir.assignedUserId,
      },
    });

    await this.logWorkflow(id, status, 'Status Update', actorId, comment);

    const updatedIr = await this.findOne(id);
    await this.dispatchWorkflowUpdateNotification(updatedIr, `IR status changed to ${this.humanizeStatus(status)}`);
    return updatedIr;
  }

  async submitResponse(
    id: string,
    data: {
      content: string;
      actorId: string;
    },
  ): Promise<InterfaceRequest> {
    const ir = await this.prisma.interfaceRequest.findUnique({ where: { id } });
    if (!ir) throw new NotFoundException();

    // Create response record
    const response = await this.prisma.iRResponse.create({
      data: {
        content: data.content,
      },
    });

    // Update IR status
    await this.prisma.interfaceRequest.update({
      where: { id },
      data: {
        status: IRStatus.awaiting_response_validation,
        responseId: response.id,
      },
    });

    await this.logWorkflow(id, IRStatus.awaiting_response_validation, 'Submitted Response', data.actorId, 'Response submitted for validation');

    const updatedIr = await this.findOne(id);
    await this.dispatchWorkflowUpdateNotification(updatedIr, 'Response submitted and awaiting validation');
    return updatedIr;
  }

  async createRequestAttachment(
    requestId: string,
    file: Express.Multer.File,
    uploadedBy: string,
  ) {
    const ir = await this.prisma.interfaceRequest.findUnique({ where: { id: requestId } });
    if (!ir) throw new NotFoundException(`IR with ID ${requestId} not found`);

    // 1. Upload ke GCS dan dapatkan path unik relatifnya
    const { gcsPath } = await this.gcsService.uploadFile(file);

    // 2. Simpan path tersebut ke database (kolom url)
    const attachment = await this.prisma.attachment.create({
      data: {
        filename: file.originalname,
        size: file.size,
        url: gcsPath,
        uploadedBy,
        requestId,
      },
    });

    // 3. Kembalikan detail attachment dengan Signed URL
    return {
      ...attachment,
      url: await this.gcsService.getSignedUrl(attachment.url),
    };
  }

  async findRequestAttachments(requestId: string) {
    const ir = await this.prisma.interfaceRequest.findUnique({ where: { id: requestId } });
    if (!ir) throw new NotFoundException(`IR with ID ${requestId} not found`);

    const attachments = await this.prisma.attachment.findMany({
      where: { requestId },
      orderBy: { uploadedAt: 'desc' },
    });

    return this.signAttachmentUrls(attachments);
  }

  private async signAttachmentUrls(attachments: any[]): Promise<any[]> {
    if (!attachments) return [];
    return Promise.all(
      attachments.map(async (att) => ({
        ...att,
        url: await this.gcsService.getSignedUrl(att.url),
      })),
    );
  }

  private humanizeStatus(status: IRStatus): string {
    return status
      .split('_')
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(' ');
  }

  private async dispatchWorkflowUpdateNotification(ir: InterfaceRequest, message: string) {
    const userIds = new Set<string>([
      ir.requestorUserId,
      ir.responderUserId,
      ir.assignedUserId,
    ].filter(Boolean) as string[]);

    for (const userId of userIds) {
      await this.notificationsService.create({
        userId,
        title: `IR ${ir.irNumber} Update`,
        message,
        type: 'workflow_update',
        link: `/ir/${ir.id}`,
      });
      this.realtimeGateway.notifyUser(userId, 'workflow:update', {
        irId: ir.id,
        status: ir.status,
        title: `IR ${ir.irNumber} Update`,
        message,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  private async logWorkflow(
    requestId: string,
    step: string,
    action: string,
    actorId: string,
    comment?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: actorId } });
    await this.prisma.workflowLog.create({
      data: {
        requestId,
        step,
        action,
        actorId,
        actorName: user?.name || 'Unknown',
        comment: comment || '',
      },
    });
  }
}
