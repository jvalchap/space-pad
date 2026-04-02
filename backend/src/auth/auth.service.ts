import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PRISMA_UNIQUE_VIOLATION_CODE } from './auth.constants';
import type {
  AuthSuccessPayload,
  AuthUserPayload,
  JwtValidatedUser,
} from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthSuccessPayload> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          password: passwordHash,
        },
      });
      return this.buildAuthResponse(user.id, user.email, user.username);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_VIOLATION_CODE
      ) {
        throw new ConflictException('Email or username is already taken');
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthSuccessPayload> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.buildAuthResponse(user.id, user.email, user.username);
  }

  toAuthUserPayload(validated: JwtValidatedUser): AuthUserPayload {
    return {
      id: validated.userId,
      email: validated.email,
      username: validated.username,
    };
  }

  private buildAuthResponse(
    userId: string,
    email: string,
    username: string,
  ): AuthSuccessPayload {
    const accessToken = this.jwtService.sign({
      sub: userId,
      email,
      username,
    });
    return {
      accessToken,
      user: { id: userId, email, username },
    };
  }
}
