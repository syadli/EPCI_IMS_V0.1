import { Controller, Get, Post, Body, Param, Put, Query, UseGuards, Request, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { Express } from 'express';
import { InterfaceRequestsService } from './interface-requests.service';
import { AuthGuard } from '../auth/auth.guard';
import { IRStatus, IRPriority } from '@prisma/client';

const attachmentStorage = diskStorage({
  destination: join(__dirname, '..', '..', 'uploads', 'attachments'),
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-_]/g, '_');
    const fileName = `${Date.now()}-${randomUUID()}-${safeName}`;
    callback(null, fileName);
  },
});

@Controller('interface-requests')
@UseGuards(AuthGuard)
export class InterfaceRequestsController {
  constructor(private readonly irService: InterfaceRequestsService) {}

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('status') status?: IRStatus,
    @Query('companyId') companyId?: string,
  ) {
    return this.irService.findAll({ projectId, status, companyId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.irService.findOne(id);
  }

  @Post()
  create(@Request() req: any, @Body() data: any) {
    return this.irService.create({
      ...data,
      requestorUserId: req.user.sub,
      requestorCompanyId: req.user.companyId,
      dueDate: new Date(data.dueDate),
    });
  }

  @Put(':id/status')
  updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { status: IRStatus; comment?: string; assignedUserId?: string },
  ) {
    return this.irService.updateStatus(id, body.status, req.user.sub, body.comment, body.assignedUserId);
  }

  @Post(':id/response')
  submitResponse(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.irService.submitResponse(id, {
      content: body.content,
      actorId: req.user.sub,
    });
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file', { storage: attachmentStorage }))
  async uploadAttachment(
    @Request() req: any,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.irService.createRequestAttachment(id, file, req.user.sub);
  }

  @Get(':id/attachments')
  async getAttachments(@Param('id') id: string) {
    return this.irService.findRequestAttachments(id);
  }
}
