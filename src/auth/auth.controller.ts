import { Body, ConflictException, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'สมัครสมาชิกใหม่ (สร้าง User พร้อมรับ JWT Token)' })
  @ApiCreatedResponse({ description: 'สมัครสมาชิกสำเร็จ พร้อม access_token' })
  @ApiConflictResponse({ description: 'อีเมลนี้ถูกใช้สมัครไว้แล้ว' })
  async register(@Body() registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('อีเมลนี้ถูกใช้สมัครไว้แล้ว');
    }

    const password = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: Role.EMPLOYEE,
        department: registerDto.department || 'General',
      },
    });

    return this.authService.createAuthResponse(user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'เข้าสู่ระบบ (User / Staff) รับ JWT Token' })
  @ApiOkResponse({ description: 'เข้าสู่ระบบสำเร็จ พร้อม access_token' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
