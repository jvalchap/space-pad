import { booleanAttribute, Component, input } from '@angular/core';

@Component({
  selector: 'app-toolbar-button',
  standalone: true,
  templateUrl: './toolbar-button.component.html',
  styleUrl: './toolbar-button.component.scss',
})
export class ToolbarButtonComponent {
  readonly label = input.required<string>();
  readonly active = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly ariaPressed = input<boolean | undefined>(undefined);
}
