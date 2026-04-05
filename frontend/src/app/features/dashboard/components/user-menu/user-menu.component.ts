import {
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { LucideUser } from '@lucide/angular';
import { AuthService } from '../../../../core/auth/auth.service';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [LucideUser, ThemeToggleComponent],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.scss',
})
export class UserMenuComponent {
  readonly authService = inject(AuthService);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly menuOpen = signal(false);

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.closeMenu();
    this.authService.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) {
      return;
    }
    const target = event.target;
    if (target instanceof Node && this.host.nativeElement.contains(target)) {
      return;
    }
    this.closeMenu();
  }

  @HostListener('document:keydown.escape')
  onEscapeCloseMenu(): void {
    if (this.menuOpen()) {
      this.closeMenu();
    }
  }
}
