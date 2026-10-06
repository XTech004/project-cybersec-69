import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  ForgotPasswordDto,
  UserLocalLoginDto,
  UserRegisterDto,
  UserResetPasswordDto,
} from './dto/strapi-auth.dto';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  @Post('local')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '2.1 User: Login (identifier = email หรือ username)' })
  @ApiOkResponse({ description: 'เข้าสู่ระบบสำเร็จ พร้อม jwt และ user' })
  async localLogin(@Body() dto: UserLocalLoginDto) {
    const user = await this.authService.validateUserByIdentifier(dto.identifier, dto.password);
    return this.authService.createAuthResponse(user);
  }

  @Post('local/register')
  @ApiOperation({ summary: '2.2 User: Signup สมัครสมาชิกผู้ใช้งานทั่วไป' })
  @ApiCreatedResponse({ description: 'สมัครสมาชิกสำเร็จ พร้อม jwt และ user' })
  async localRegister(@Body() dto: UserRegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('อีเมลนี้ถูกใช้สมัครไว้แล้ว');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.username,
        lastName: '',
        role: Role.EMPLOYEE,
        department: 'General',
      },
    });

    return this.authService.createAuthResponse(user);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '2.3 User: Forgot Password ขอรหัสสำหรับรีเซ็ตรหัสผ่าน' })
  @ApiOkResponse({ description: 'ส่ง code สำหรับรีเซ็ตรหัสผ่านสำเร็จ' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('ไม่พบผู้ใช้งานด้วยอีเมลนี้');
    }

    const code = this.authService.createResetToken(user.email);
    return {
      ok: true,
      code,
      message: 'รหัส code สำหรับรีเซ็ตถูกส่งไปยังอีเมลแล้ว',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '2.3.1 User: Reset Password ยืนยันรหัสผ่านใหม่' })
  @ApiOkResponse({ description: 'รีเซ็ตรหัสผ่านสำเร็จ พร้อม jwt token ใหม่' })
  async resetPassword(@Body() dto: UserResetPasswordDto) {
    if (dto.password !== dto.passwordConfirmation) {
      throw new BadRequestException('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
    }

    const updatedUser = await this.authService.verifyAndResetPassword(dto.code, dto.password);
    return this.authService.createAuthResponse(updatedUser);
  }

  // --- Standard NestJS endpoints preserved for backward compatibility ---

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
