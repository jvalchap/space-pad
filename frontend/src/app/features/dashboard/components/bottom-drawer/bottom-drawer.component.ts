import {
  Component,
  booleanAttribute,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { BlockType, PanelTemplateId } from '../../models/block';
import { TemplateService } from '../../services/template.service';

@Component({
  selector: 'app-bottom-drawer',
  standalone: true,
  templateUrl: './bottom-drawer.component.html',
  styleUrl: './bottom-drawer.component.scss',
})
export class BottomDrawerComponent {
  readonly BlockType = BlockType;

  private readonly templateService = inject(TemplateService);

  readonly blockTemplates = this.templateService
    .listTemplates()
    .filter((template) => template.id !== PanelTemplateId.Empty);

  readonly open = input(false, { transform: booleanAttribute });

  readonly closeDrawer = output<void>();

  readonly blockTypePicked = output<BlockType>();

  readonly templatePicked = output<PanelTemplateId>();

  constructor() {
    effect((onCleanup) => {
      if (typeof document === 'undefined') {
        return;
      }
      if (!this.open()) {
        return;
      }
      const onKeydown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
          event.preventDefault();
          this.closeDrawer.emit();
        }
      };
      document.addEventListener('keydown', onKeydown);
      onCleanup(() => document.removeEventListener('keydown', onKeydown));
    });

    effect((onCleanup) => {
      if (typeof document === 'undefined') {
        return;
      }
      if (!this.open()) {
        return;
      }
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      onCleanup(() => {
        document.body.style.overflow = previous;
      });
    });
  }

  pickType(type: BlockType): void {
    this.blockTypePicked.emit(type);
  }

  pickTemplate(templateId: PanelTemplateId): void {
    this.templatePicked.emit(templateId);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeDrawer.emit();
    }
  }
}
