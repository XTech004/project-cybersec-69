import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserService } from './user.service';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'ดูข้อมูลโปรไฟล์ของผู้ใช้ที่ Login อยู่' })
  @ApiOkResponse({ description: 'ข้อมูลผู้ใช้ปัจจุบัน' })
  async me(@CurrentUser('id') userId: string) {
    return this.userService.findProfile(userId);
  }

  @Get()
  @ApiOperation({ summary: 'ดูรายชื่อผู้ใช้งานทั้งหมด' })
  @ApiOkResponse({ description: 'รายการผู้ใช้งานทั้งหมด' })
  async findAll() {
    return this.userService.findAll();
  }
}
