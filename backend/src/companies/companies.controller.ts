import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { AuthGuard } from '../auth/auth.guard';
import { Prisma } from '@prisma/client';

@Controller('companies')
@UseGuards(AuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Post()
  create(@Body() data: Prisma.CompanyCreateInput) {
    return this.companiesService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Prisma.CompanyUpdateInput) {
    return this.companiesService.update(id, data);
  }
}
