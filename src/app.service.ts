import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'IT Service Desk & Incident Ticket API',
      version: '1.0.0',
      description: 'ระบบแจ้งซ่อมและขอความช่วยเหลือด้านไอทีภายในองค์กร',
      dashboard: '/admin',
      docs: '/api',
    };
  }
}
