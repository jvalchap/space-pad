import { Injectable, NotFoundException } from '@nestjs/common';
import { Block } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { PatchBlockDto } from './dto/patch-block.dto';

@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  mapPrismaBlockToApi(row: Block): Record<string, unknown> {
    const content = row.content as Record<string, unknown>;
    const type = row.type;
    if (type === 'text') {
      const body = String(content['text'] ?? content['content'] ?? '');
      const title = content['title'];
      return {
        id: row.id,
        type: 'text',
        content: body,
        ...(typeof title === 'string' && title.length > 0 ? { title } : {}),
      };
    }
    if (type === 'checklist') {
      const title = content['title'];
      return {
        id: row.id,
        type: 'checklist',
        content: String(content['content'] ?? ''),
        items: Array.isArray(content['items']) ? content['items'] : [],
        ...(typeof title === 'string' && title.length > 0 ? { title } : {}),
      };
    }
    if (type === 'card') {
      const col = content['column'];
      const column =
        col === 'doing' || col === 'done' || col === 'todo' ? col : 'todo';
      return {
        id: row.id,
        type: 'card',
        content: String(content['text'] ?? content['content'] ?? ''),
        column,
      };
    }
    return {
      id: row.id,
      type,
      ...content,
    };
  }

  private normalizeJsonContent(type: string, content: unknown): object {
    if (content !== null && typeof content === 'object' && !Array.isArray(content)) {
      return { ...(content as Record<string, unknown>) };
    }
    if (type === 'text' && typeof content === 'string') {
      return { text: content };
    }
    if (type === 'card' && typeof content === 'string') {
      return { text: content, column: 'todo' };
    }
    return {};
  }

  async create(dto: CreateBlockDto): Promise<Record<string, unknown>> {
    const row = await this.prisma.block.create({
      data: {
        type: dto.type,
        content: this.normalizeJsonContent(dto.type, dto.content),
        position: dto.position,
        dashboardId: dto.dashboardId,
      },
    });
    return this.mapPrismaBlockToApi(row);
  }

  async findForDashboard(dashboardId: string): Promise<Record<string, unknown>[]> {
    const rows = await this.prisma.block.findMany({
      where: { dashboardId },
      orderBy: { position: 'asc' },
    });
    return rows.map((row) => this.mapPrismaBlockToApi(row));
  }

  async patch(id: string, dto: PatchBlockDto): Promise<Record<string, unknown>> {
    const current = await this.prisma.block.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException(`Block ${String(id)} not found`);
    }
    const data: { content?: object; position?: number; dashboardId?: string } = {};
    if (dto.dashboardId !== undefined) {
      data.dashboardId = dto.dashboardId;
    }
    if (dto.position !== undefined) {
      data.position = dto.position;
    }
    if (dto.content !== undefined) {
      const previous = current.content as Record<string, unknown>;
      const patch =
        dto.content !== null &&
        typeof dto.content === 'object' &&
        !Array.isArray(dto.content)
          ? (dto.content as Record<string, unknown>)
          : {};
      data.content = { ...previous, ...patch };
    }
    const row = await this.prisma.block.update({
      where: { id },
      data,
    });
    return this.mapPrismaBlockToApi(row);
  }

  async deleteMany(ids: string[]): Promise<{ deleted: number }> {
    const result = await this.prisma.block.deleteMany({
      where: { id: { in: ids } },
    });
    return { deleted: result.count };
  }
}
