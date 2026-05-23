import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Project, Prisma } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Project[]> {
    return this.prisma.project.findMany({
      include: {
        companies: true,
        _count: {
          select: { users: true, interfaceRequests: true },
        },
      },
    });
  }

  async findOne(id: string): Promise<Project | null> {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        companies: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            company: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.ProjectCreateInput): Promise<Project> {
    return this.prisma.project.create({
      data,
    });
  }

  async update(id: string, data: Prisma.ProjectUpdateInput): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async assignCompany(projectId: string, companyId: string) {
    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        companies: {
          connect: { id: companyId },
        },
      },
    });
  }

  async assignUser(projectId: string, userId: string) {
    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        users: {
          connect: { id: userId },
        },
      },
    });
  }
}
