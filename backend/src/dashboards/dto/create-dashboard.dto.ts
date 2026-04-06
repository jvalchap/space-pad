import { IsIn, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateDashboardDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsIn(['DEFAULT', 'BOARD'])
  type!: 'DEFAULT' | 'BOARD';

  @IsUUID()
  userId!: string;
}
