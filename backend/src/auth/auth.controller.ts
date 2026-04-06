import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import type {
  AuthSuccessPayload,
  AuthUserPayload,
  JwtValidatedUser,
  UsernameAvailabilityPayload,
} from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UsernameAvailabilityQueryDto } from './dto/username-availability.query.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('username-availability')
  usernameAvailability(
    @Query() query: UsernameAvailabilityQueryDto,
  ): Promise<UsernameAvailabilityPayload> {
    return this.authService.getUsernameAvailability(query.username);
  }

  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthSuccessPayload> {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto): Promise<AuthSuccessPayload> {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Req() request: { user: JwtValidatedUser }): AuthUserPayload {
    return this.authService.toAuthUserPayload(request.user);
  }
}
