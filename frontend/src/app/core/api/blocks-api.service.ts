import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { Block } from '../../features/dashboard/models/block';
import { API_BASE_URL } from './api-base-url.token';

@Injectable({
  providedIn: 'root',
})
export class BlocksApiService {
  private readonly http = inject(HttpClient);

  private readonly apiBaseUrl = inject(API_BASE_URL);

  getBlocks(): Observable<Block[]> {
    return this.http.get<Block[]>(`${this.apiBaseUrl}/blocks`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('[BlocksApiService] getBlocks failed', error.message);
        return of([]);
      }),
    );
  }
}
