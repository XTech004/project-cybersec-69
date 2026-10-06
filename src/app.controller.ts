import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiExcludeEndpoint()
  getInfo() {
    return this.appService.getInfo();
  }

  @Get('login')
  @ApiExcludeEndpoint()
  @Redirect('/admin/login.html', 302)
  login() {
    return { url: '/admin/login.html' };
  }
}
