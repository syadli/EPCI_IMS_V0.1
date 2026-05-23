import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AuthGuard } from '../auth/auth.guard';
import { Prisma } from '@prisma/client';

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  create(@Body() data: Prisma.ProjectCreateInput) {
    return this.projectsService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Prisma.ProjectUpdateInput) {
    return this.projectsService.update(id, data);
  }

  @Post(':id/companies/:companyId')
  assignCompany(@Param('id') id: string, @Param('companyId') companyId: string) {
    return this.projectsService.assignCompany(id, companyId);
  }

  @Post(':id/users/:userId')
  assignUser(@Param('id') id: string, @Param('userId') userId: string) {
    return this.projectsService.assignUser(id, userId);
  }
}
