import { Component, inject } from '@angular/core';
import { ThemeMode } from '../../../../core/theme/theme-mode.enum';
import { ThemeService } from '../../../../core/theme/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);

  readonly ThemeMode = ThemeMode;

  onClick(): void {
    this.theme.toggle();
  }
}
