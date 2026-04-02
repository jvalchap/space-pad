import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ApiBlockDto, ApiBlockType } from './blocks.types';

@Injectable()
export class BlocksService {
  getMockBlocks(): ApiBlockDto[] {
    return [
      {
        id: randomUUID(),
        type: ApiBlockType.Text,
        content: 'This is a text block.',
      },
      {
        id: randomUUID(),
        type: ApiBlockType.Checklist,
        content: '',
        items: [
          { text: 'First item', checked: true },
          { text: 'Second item', checked: false },
        ],
      },
      {
        id: randomUUID(),
        type: ApiBlockType.Text,
        content: 'This is another text block.',
      },
    ];
  }
}
