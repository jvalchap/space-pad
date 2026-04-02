import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../api/api-base-url.token';
import type { AuthSuccessResponse, AuthUser } from './auth.models';
import { AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY } from './auth-storage-key.constant';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  readonly user = signal<AuthUser | null>(null);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.restoreFromStorage();
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  login(email: string, password: string): Observable<AuthSuccessResponse> {
    return this.http
      .post<AuthSuccessResponse>(`${this.apiBaseUrl}/auth/login`, { email, password })
      .pipe(tap((response) => this.persistSession(response)));
  }

  register(email: string, username: string, password: string): Observable<AuthSuccessResponse> {
    return this.http
      .post<AuthSuccessResponse>(`${this.apiBaseUrl}/auth/register`, {
        email,
        username,
        password,
      })
      .pipe(tap((response) => this.persistSession(response)));
  }

  logout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  private restoreFromStorage(): void {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    const userJson = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    
    if (token === null || userJson === null) {
      return;
    }
    try {
      const parsed = JSON.parse(userJson) as AuthUser;
      this.user.set(parsed);
    } catch {
      this.clearSession();
    }
  }

  private persistSession(response: AuthSuccessResponse): void {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, response.accessToken);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(response.user));
    this.user.set(response.user);
  }

  private clearSession(): void {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    this.user.set(null);
  }
}
