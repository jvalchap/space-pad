export enum DashboardTypeApi {
  Default = 'DEFAULT',
  Board = 'BOARD',
}

export function isDashboardTypeApi(value: unknown): value is DashboardTypeApi {
  return value === DashboardTypeApi.Default || value === DashboardTypeApi.Board;
}
