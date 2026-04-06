import { Allow, IsInt, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateBlockDto {
  @IsString()
  @MinLength(1)
  type!: string;

  @IsOptional()
  @Allow()
  content?: unknown;

  @IsInt()
  position!: number;

  @IsUUID()
  dashboardId!: string;
}
