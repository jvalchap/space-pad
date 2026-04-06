import { IsString, MaxLength, MinLength } from 'class-validator';

export class UsernameAvailabilityQueryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  username: string;
}
