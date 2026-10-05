import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [AdminController],
})
export class AdminModule {}
