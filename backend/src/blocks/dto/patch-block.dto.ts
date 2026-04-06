import { Allow, IsInt, IsOptional, IsUUID } from 'class-validator';

export class PatchBlockDto {
  @IsOptional()
  @Allow()
  content?: unknown;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @IsUUID()
  dashboardId?: string;
}
