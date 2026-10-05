import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'wichai@company.local' })
  @IsEmail({}, { message: 'email ต้องเป็นรูปแบบอีเมลที่ถูกต้อง' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'password ต้องมีความยาวอย่างน้อย 8 ตัวอักษร' })
  @MaxLength(72, { message: 'password ต้องมีความยาวไม่เกิน 72 ตัวอักษร' })
  password: string;

  @ApiProperty({ example: 'Wichai' })
  @IsString()
  @IsNotEmpty({ message: 'firstName is required' })
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Thongchai' })
  @IsString()
  @IsNotEmpty({ message: 'lastName is required' })
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ example: 'Finance', default: 'General' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;
}
