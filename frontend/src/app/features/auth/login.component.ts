import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeToggleComponent } from '../dashboard/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ThemeToggleComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly isRegisterMode = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  email = '';
  username = '';
  password = '';

  toggleMode(): void {
    this.isRegisterMode.update((value) => !value);
    this.errorMessage.set('');
  }

  submit(): void {
    this.errorMessage.set('');
    this.isSubmitting.set(true);
    const registerMode = this.isRegisterMode();
    const request$ = registerMode
      ? this.authService.register(this.email.trim(), this.username.trim(), this.password)
      : this.authService.login(this.email.trim(), this.password);

    request$.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
      next: () => {
        void this.router.navigate(['/']);
      },
      error: (error: unknown) => {
        const message = this.resolveErrorMessage(error);
        this.errorMessage.set(message);
      },
    });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error;
      if (typeof body === 'object' && body !== null && 'message' in body) {
        const message = (body as { message: unknown }).message;
        if (typeof message === 'string') {
          return message;
        }
        if (Array.isArray(message)) {
          return message.filter((item) => typeof item === 'string').join(' ');
        }
      }
      if (error.status === 0) {
        return 'Could not connect to the server. Check if the backend is running.';
      }
    }
    return 'An error occurred. Try again.';
  }
}
