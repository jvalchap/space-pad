import { Injectable, NotFoundException } from '@nestjs/common';
import { Dashboard, DashboardType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BlocksService } from '../blocks/blocks.service';
import { CreateDashboardDto } from './dto/create-dashboard.dto';

@Injectable()
export class DashboardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blocksService: BlocksService,
  ) {}

  create(dto: CreateDashboardDto): Promise<Dashboard> {
    return this.prisma.dashboard.create({
      data: {
        title: dto.title,
        type: dto.type,
        userId: dto.userId,
      },
    });
  }

  findAllForUser(userId: string): Promise<Dashboard[]> {
    return this.prisma.dashboard.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOneWithBlocks(id: string) {
    const dashboard = await this.prisma.dashboard.findUnique({
      where: { id },
      include: {
        blocks: {
          orderBy: { position: 'asc' },
        },
      },
    });
    if (!dashboard) {
      throw new NotFoundException(`Dashboard ${id} not found`);
    }
    return {
      id: dashboard.id,
      title: dashboard.title,
      type: dashboard.type,
      userId: dashboard.userId,
      createdAt: dashboard.createdAt,
      blocks: dashboard.blocks.map((b) => this.blocksService.mapPrismaBlockToApi(b)),
    };
  }

  async seedInitialBlockIfEmpty(dashboardId: string, dashboardType: DashboardType): Promise<void> {
    const count = await this.prisma.block.count({ where: { dashboardId } });
    if (count > 0) {
      return;
    }
    if (dashboardType === DashboardType.BOARD) {
      await this.prisma.block.create({
        data: {
          type: 'card',
          content: { text: '', column: 'todo' },
          position: 0,
          dashboardId,
        },
      });
      return;
    }
    await this.prisma.block.create({
      data: {
        type: 'text',
        content: { text: '' },
        position: 0,
        dashboardId,
      },
    });
  }

  async deleteDashboard(id: string): Promise<{ deleted: boolean }> {
    await this.prisma.$transaction([
      this.prisma.block.deleteMany({ where: { dashboardId: id } }),
      this.prisma.dashboard.delete({ where: { id } }),
    ]);
    return { deleted: true };
  }
}
