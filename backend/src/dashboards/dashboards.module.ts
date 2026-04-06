import { Module } from '@nestjs/common';
import { BlocksModule } from '../blocks/blocks.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DashboardDetailController } from './dashboard-detail.controller';
import { DashboardsController } from './dashboards.controller';
import { DashboardsService } from './dashboards.service';

@Module({
  imports: [PrismaModule, BlocksModule],
  controllers: [DashboardsController, DashboardDetailController],
  providers: [DashboardsService],
  exports: [DashboardsService],
})
export class DashboardsModule {}
