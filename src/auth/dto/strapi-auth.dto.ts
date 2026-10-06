import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@servicedesk.local' })
  @IsEmail({}, { message: 'email ต้องเป็นรูปแบบอีเมลที่ถูกต้อง' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty({ message: 'password is required' })
  password: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class AdminRegisterDto {
  @ApiProperty({ example: 'Admin' })
  @IsString()
  @IsNotEmpty({ message: 'firstname is required' })
  firstname: string;

  @ApiProperty({ example: 'Super' })
  @IsString()
  @IsNotEmpty({ message: 'lastname is required' })
  lastname: string;

  @ApiProperty({ example: 'superadmin@servicedesk.local' })
  @IsEmail({}, { message: 'email ต้องเป็นรูปแบบอีเมลที่ถูกต้อง' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;

  @ApiProperty({ example: 'Password123!', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'password ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' })
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'admin@servicedesk.local' })
  @IsEmail({}, { message: 'email ต้องเป็นรูปแบบอีเมลที่ถูกต้อง' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;
}

export class AdminResetPasswordDto {
  @ApiProperty({ example: 'reset-token-xyz' })
  @IsString()
  @IsNotEmpty({ message: 'resetPasswordToken is required' })
  resetPasswordToken: string;

  @ApiProperty({ example: 'NewPassword123!', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'password ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' })
  password: string;
}

export class UserLocalLoginDto {
  @ApiProperty({ example: 'employee1@servicedesk.local', description: 'อีเมลหรือชื่อผู้ใช้' })
  @IsString()
  @IsNotEmpty({ message: 'identifier is required' })
  identifier: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty({ message: 'password is required' })
  password: string;
}

export class UserRegisterDto {
  @ApiProperty({ example: 'john_doe' })
  @IsString()
  @IsNotEmpty({ message: 'username is required' })
  username: string;

  @ApiProperty({ example: 'john@servicedesk.local' })
  @IsEmail({}, { message: 'email ต้องเป็นรูปแบบอีเมลที่ถูกต้อง' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;

  @ApiProperty({ example: 'Password123!', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'password ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' })
  password: string;
}

export class UserResetPasswordDto {
  @ApiProperty({ example: 'reset-code-xyz' })
  @IsString()
  @IsNotEmpty({ message: 'code is required' })
  code: string;

  @ApiProperty({ example: 'NewPassword123!', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'password ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' })
  password: string;

  @ApiProperty({ example: 'NewPassword123!', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'passwordConfirmation is required' })
  passwordConfirmation: string;
}
