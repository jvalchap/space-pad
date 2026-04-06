import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardTypeApi } from '../../features/dashboard/models/dashboard-type.model';
import { API_BASE_URL } from './api-base-url.token';

export interface DashboardSummaryDto {
  readonly id: string;
  readonly title: string;
  readonly type: DashboardTypeApi;
  readonly userId: string;
  readonly createdAt: string;
}

export interface CreateDashboardRequest {
  readonly title: string;
  readonly type: DashboardTypeApi;
  readonly userId: string;
}

export interface DashboardDetailDto extends DashboardSummaryDto {
  readonly blocks: unknown[];
}

export interface DeleteDashboardResponse {
  deleted: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getDashboardsForUser(userId: string): Observable<DashboardSummaryDto[]> {
    return this.http.get<DashboardSummaryDto[]>(`${this.apiBaseUrl}/dashboards/${userId}`);
  }

  getDashboard(id: string): Observable<DashboardDetailDto> {
    return this.http.get<DashboardDetailDto>(`${this.apiBaseUrl}/dashboard/${id}`);
  }

  createDashboard(body: CreateDashboardRequest): Observable<DashboardSummaryDto> {
    return this.http.post<DashboardSummaryDto>(`${this.apiBaseUrl}/dashboards`, body);
  }

  deleteDashboard(id: string): Observable<DeleteDashboardResponse> {
    return this.http.delete<DeleteDashboardResponse>(`${this.apiBaseUrl}/dashboards/${id}`);
  }
}
