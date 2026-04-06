import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BlocksModule } from './blocks/blocks.module';
import { DashboardsModule } from './dashboards/dashboards.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, BlocksModule, DashboardsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
