import { booleanAttribute, Component, input, output } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ChecklistBlockComponent } from '../checklist-block/checklist-block.component';
import { TextBlockComponent } from '../text-block/text-block.component';
import {
  Block,
  BlockType,
  ChecklistBlock,
  TextBlock,
} from '../../models/block.model';
import {
  BlockContentChangePayload,
  BlocksReorderPayload,
  ChecklistItemKeydownPayload,
  ChecklistItemTextPayload,
  ChecklistTogglePayload,
  TextLikeFieldKeydownPayload,
} from '../../models/block-ui-payloads.model';

@Component({
  selector: 'app-block-list',
  standalone: true,
  imports: [DragDropModule, TextBlockComponent, ChecklistBlockComponent],
  templateUrl: './block-list.component.html',
  styleUrl: './block-list.component.scss',
})
export class BlockListComponent {
  readonly BlockType = BlockType;

  readonly blocks = input.required<Block[]>();

  readonly reorderMode = input(false, { transform: booleanAttribute });

  readonly blocksReordered = output<BlocksReorderPayload>();

  readonly contentChange = output<BlockContentChangePayload>();

  readonly fieldKeydown = output<TextLikeFieldKeydownPayload>();

  readonly toggleItem = output<ChecklistTogglePayload>();

  readonly itemTextChange = output<ChecklistItemTextPayload>();

  readonly itemKeydown = output<ChecklistItemKeydownPayload>();

  asTextBlock(block: Block): TextBlock {
    if (block.type !== BlockType.Text) {
      throw new Error('Expected text block');
    }
    return block;
  }

  asChecklistBlock(block: Block): ChecklistBlock {
    if (block.type !== BlockType.Checklist) {
      throw new Error('Expected checklist block');
    }
    return block;
  }

  onDrop(event: CdkDragDrop<Block[]>): void {
    if (!this.reorderMode()) {
      return;
    }
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    this.blocksReordered.emit({
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex,
    });
  }
}
