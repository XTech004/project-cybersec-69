import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

interface ResetTokenData {
  email: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private resetTokens = new Map<string, ResetTokenData>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    return user;
  }

  async validateUserByIdentifier(identifier: string, password: string): Promise<User> {
    // identifier can be email or username/firstName
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { firstName: identifier },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    return this.createAuthResponse(user);
  }

  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async createAuthResponse(user: Partial<User> & { id: string; email: string; firstName: string; lastName: string; role: any }) {
    const safeUser = this.toSafeUser(user);
    const access_token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      jwt: access_token,
      access_token,
      token_type: 'Bearer',
      expires_in: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
      user: safeUser,
      data: {
        token: access_token,
        user: safeUser,
      },
    };
  }

  createResetToken(email: string): string {
    const token = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
    // Token valid for 1 hour
    this.resetTokens.set(token, {
      email,
      expiresAt: Date.now() + 3600 * 1000,
    });
    return token;
  }

  async verifyAndResetPassword(tokenOrCode: string, newPassword: string): Promise<User> {
    const entry = this.resetTokens.get(tokenOrCode);
    if (!entry) {
      throw new BadRequestException('รหัสรีเซ็ต (Token / Code) ไม่ถูกต้อง หรือหมดอายุแล้ว');
    }

    if (Date.now() > entry.expiresAt) {
      this.resetTokens.delete(tokenOrCode);
      throw new BadRequestException('รหัสรีเซ็ต (Token / Code) หมดอายุแล้ว');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: entry.email },
    });

    if (!user) {
      this.resetTokens.delete(tokenOrCode);
      throw new NotFoundException('ไม่พบบัญชีผู้ใช้สำหรับรีเซ็ตรหัสผ่าน');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    this.resetTokens.delete(tokenOrCode);
    return updatedUser;
  }

  toSafeUser(user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: any;
    department?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const username = firstName || user.email.split('@')[0];

    return {
      id: user.id,
      username,
      email: user.email,
      firstName,
      lastName,
      firstname: firstName,
      lastname: lastName,
      role: user.role,
      department: user.department || 'General',
      provider: 'local',
      confirmed: true,
      blocked: false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
