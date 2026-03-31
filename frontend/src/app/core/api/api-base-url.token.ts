import { InjectionToken } from '@angular/core';
import { DEFAULT_API_BASE_URL } from './api-base-url.default';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  factory: (): string => DEFAULT_API_BASE_URL,
});
