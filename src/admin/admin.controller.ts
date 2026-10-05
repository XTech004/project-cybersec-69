import { Body, Controller, Get, HttpCode, HttpStatus, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuthService } from 'src/auth/auth.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { LoginDto } from 'src/auth/dto/login.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserService } from 'src/user/user.service';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'เข้าสู่ระบบสำหรับผู้ดูแล (ADMIN เท่านั้น)' })
  @ApiOkResponse({ description: 'เข้าสู่ระบบสำเร็จ พร้อม access_token' })
  @ApiUnauthorizedResponse({ description: 'อีเมล/รหัสผ่านไม่ถูกต้อง หรือไม่ใช่ผู้ดูแล' })
  async adminLogin(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);

    if (user.role !== Role.ADMIN) {
      throw new UnauthorizedException('บัญชีนี้ไม่มีสิทธิ์เข้าสู่ระบบส่วนผู้ดูแล');
    }

    return this.authService.createAuthResponse(user);
  }

  @Get('users/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'ดูข้อมูลโปรไฟล์ผู้ดูแล (ADMIN เท่านั้น)' })
  @ApiOkResponse({ description: 'ข้อมูลผู้ดูแลปัจจุบัน' })
  async adminProfile(@CurrentUser('id') userId: string) {
    return this.userService.findProfile(userId);
  }
}
