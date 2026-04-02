import { Controller, Get } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { ApiBlockDto } from './blocks.types';

@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get()
  findAll(): ApiBlockDto[] {
    return this.blocksService.getMockBlocks();
  }
}
