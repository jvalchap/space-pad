import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { DeleteBlocksDto } from './dto/delete-blocks.dto';
import { PatchBlockDto } from './dto/patch-block.dto';

@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get()
  findForDashboard(@Query('dashboardId') dashboardId?: string): Promise<Record<string, unknown>[]> {
    if (dashboardId === undefined || dashboardId === '') {
      return Promise.resolve([]);
    }
    return this.blocksService.findForDashboard(dashboardId);
  }

  @Post()
  create(@Body() dto: CreateBlockDto): Promise<Record<string, unknown>> {
    return this.blocksService.create(dto);
  }

  @Patch(':id')
  patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PatchBlockDto,
  ): Promise<Record<string, unknown>> {
    return this.blocksService.patch(id, dto);
  }

  @Delete()
  @HttpCode(200)
  deleteMany(@Body() dto: DeleteBlocksDto): Promise<{ deleted: number }> {
    return this.blocksService.deleteMany(dto.ids);
  }
}
