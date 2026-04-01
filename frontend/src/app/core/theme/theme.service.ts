import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { ThemeMode } from './theme-mode.enum';
import { THEME_MODE_STORAGE_KEY } from './theme-storage-key.constant';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private readonly platformId = inject(PLATFORM_ID);

  readonly mode = signal<ThemeMode>(ThemeMode.Light);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const stored = localStorage.getItem(THEME_MODE_STORAGE_KEY);
    const initial =
      stored === ThemeMode.Dark ? ThemeMode.Dark : ThemeMode.Light;
    this.mode.set(initial);
    this.applyModeToDocument(initial);
  }

  toggle(): void {
    const next =
      this.mode() === ThemeMode.Dark ? ThemeMode.Light : ThemeMode.Dark;
    this.setMode(next);
  }

  setMode(next: ThemeMode): void {
    this.mode.set(next);
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    localStorage.setItem(THEME_MODE_STORAGE_KEY, next);
    this.applyModeToDocument(next);
  }

  private applyModeToDocument(next: ThemeMode): void {
    const root = this.document.documentElement;
    root.classList.toggle('dark', next === ThemeMode.Dark);
  }
}
