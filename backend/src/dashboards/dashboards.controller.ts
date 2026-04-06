import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { DashboardsService } from './dashboards.service';

@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Post()
  async create(@Body() dto: CreateDashboardDto) {
    const dashboard = await this.dashboardsService.create(dto);
    await this.dashboardsService.seedInitialBlockIfEmpty(dashboard.id, dashboard.type);
    return dashboard;
  }

  @Get(':userId')
  findForUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.dashboardsService.findAllForUser(userId);
  }
}
