import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';
import { join } from 'path';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiExcludeEndpoint()
  getInfo() {
    return this.appService.getInfo();
  }

  // ==========================================
  // 👤 1. USER URLS (Clean URLs)
  // ==========================================
  @Get('login')
  @ApiExcludeEndpoint()
  serveUserLogin(@Res() res: Response) {
    return res.sendFile(join(process.cwd(), 'public', 'login.html'));
  }

  @Get('register')
  @ApiExcludeEndpoint()
  serveUserRegister(@Res() res: Response) {
    return res.sendFile(join(process.cwd(), 'public', 'register.html'));
  }

  @Get('forgot-password')
  @ApiExcludeEndpoint()
  serveUserForgotPassword(@Res() res: Response) {
    return res.sendFile(join(process.cwd(), 'public', 'forgot-password.html'));
  }

  // ==========================================
  // 👑 2. ADMIN URLS (Clean URLs)
  // ==========================================
  @Get('admin/login')
  @ApiExcludeEndpoint()
  serveAdminLogin(@Res() res: Response) {
    return res.sendFile(join(process.cwd(), 'public', 'admin', 'login.html'));
  }

  @Get('admin/register')
  @ApiExcludeEndpoint()
  serveAdminRegister(@Res() res: Response) {
    return res.sendFile(join(process.cwd(), 'public', 'admin', 'register.html'));
  }

  @Get('admin/forgot-password')
  @ApiExcludeEndpoint()
  serveAdminForgotPassword(@Res() res: Response) {
    return res.sendFile(join(process.cwd(), 'public', 'admin', 'forgot-password.html'));
  }
}
