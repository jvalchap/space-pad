import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { DashboardsService } from './dashboards.service';

@Controller('dashboard')
export class DashboardDetailController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.dashboardsService.findOneWithBlocks(id);
  }
}
