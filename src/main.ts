import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Serve Web Admin Dashboard
  const publicAdminDir = path.join(process.cwd(), 'public', 'admin');
  app.use('/admin', express.static(publicAdminDir));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('IT Service Desk & Incident Ticket API')
    .setDescription(
      'ระบบแจ้งซ่อมและขอความช่วยเหลือด้านไอทีภายในองค์กร — project-cybersec-69 (Sec 69)',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('Authentication', 'ระบบยืนยันตัวตน (Register / Login)')
    .addTag('Users', 'ข้อมูลผู้ใช้')
    .addTag('Admin', 'ระบบผู้ดูแล')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const port = configService.get<number>('APP_PORT', 9091);
  await app.listen(port);

  new Logger('Bootstrap').log(`IT Service Desk API listening on http://localhost:${port}`);
  new Logger('Bootstrap').log(`Web Admin Dashboard: http://localhost:${port}/admin`);
  new Logger('Bootstrap').log(`Swagger OpenAPI docs: http://localhost:${port}/api`);
}

bootstrap();
