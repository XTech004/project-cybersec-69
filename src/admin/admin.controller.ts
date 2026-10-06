import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from 'src/auth/auth.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import {
  AdminLoginDto,
  AdminRegisterDto,
  AdminResetPasswordDto,
  ForgotPasswordDto,
} from 'src/auth/dto/strapi-auth.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '1.1 Admin: Login เข้าสู่ระบบสำหรับผู้ดูแล' })
  @ApiOkResponse({ description: 'เข้าสู่ระบบสำเร็จ พร้อม data.token' })
  @ApiUnauthorizedResponse({ description: 'อีเมล/รหัสผ่านไม่ถูกต้อง หรือไม่ใช่ผู้ดูแล' })
  async adminLogin(@Body() loginDto: AdminLoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);

    if (user.role !== Role.ADMIN) {
      throw new UnauthorizedException('บัญชีนี้ไม่มีสิทธิ์เข้าสู่ระบบส่วนผู้ดูแล');
    }

    return this.authService.createAuthResponse(user);
  }

  @Post('register-admin')
  @ApiOperation({ summary: '1.2 Admin: Signup สมัครแอดมินคนแรก / Super Admin' })
  @ApiCreatedResponse({ description: 'สร้าง Super Admin สำเร็จ' })
  async registerAdmin(@Body() dto: AdminRegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('อีเมลนี้ถูกใช้สมัครเป็นผู้ดูแลแล้ว');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const adminUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstname,
        lastName: dto.lastname,
        role: Role.ADMIN,
        department: 'Management',
      },
    });

    return this.authService.createAuthResponse(adminUser);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '1.3 Admin: Forgot Password ขอรหัสสำหรับรีเซ็ตรหัสผ่าน' })
  @ApiOkResponse({ description: 'ส่ง token สำหรับรีเซ็ตรหัสผ่านสำเร็จ' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || user.role !== Role.ADMIN) {
      throw new NotFoundException('ไม่พบบัญชีผู้ดูแลด้วยอีเมลนี้');
    }

    const token = this.authService.createResetToken(user.email);
    return {
      ok: true,
      resetPasswordToken: token,
      message: 'Token สำหรับรีเซ็ตรหัสผ่านถูกสร้างเรียบร้อยแล้ว',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '1.3.1 Admin: Reset Password ยืนยันรหัสผ่านใหม่' })
  @ApiOkResponse({ description: 'รีเซ็ตรหัสผ่านสำเร็จ' })
  async resetPassword(@Body() dto: AdminResetPasswordDto) {
    await this.authService.verifyAndResetPassword(dto.resetPasswordToken, dto.password);
    return {
      ok: true,
      message: 'รีเซ็ตรหัสผ่านผู้ดูแลเรียบร้อยแล้ว',
    };
  }

  @Get('users/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '1.4 Admin: Profile ดูข้อมูลโปรไฟล์ผู้ดูแล (ADMIN เท่านั้น)' })
  @ApiOkResponse({ description: 'ข้อมูลผู้ดูแลปัจจุบัน' })
  async adminProfile(@CurrentUser('id') userId: string) {
    const profile = await this.userService.findProfile(userId);
    return {
      data: profile,
      ...profile,
    };
  }
}
