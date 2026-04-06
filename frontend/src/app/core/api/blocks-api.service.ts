import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-base-url.token';

export interface CreateBlockRequest {
  readonly type: string;
  readonly content?: unknown;
  readonly position: number;
  readonly dashboardId: string;
}

export interface PatchBlockRequest {
  readonly content?: unknown;
  readonly position?: number;
  readonly dashboardId?: string;
}

export interface DeleteBlocksRequest {
  readonly ids: string[];
}

export interface DeleteBlocksResponse {
  readonly deleted: number;
}

@Injectable({
  providedIn: 'root',
})
export class BlocksApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getBlocksForDashboard(dashboardId: string): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.apiBaseUrl}/blocks`, {
      params: { dashboardId },
    });
  }

  createBlock(body: CreateBlockRequest): Observable<unknown> {
    return this.http.post<unknown>(`${this.apiBaseUrl}/blocks`, body);
  }

  patchBlock(blockId: string, body: PatchBlockRequest): Observable<unknown> {
    return this.http.patch<unknown>(`${this.apiBaseUrl}/blocks/${blockId}`, body);
  }

  deleteBlocks(ids: string[]): Observable<DeleteBlocksResponse> {
    return this.http.request<DeleteBlocksResponse>('DELETE', `${this.apiBaseUrl}/blocks`, {
      body: { ids },
    });
  }
}
