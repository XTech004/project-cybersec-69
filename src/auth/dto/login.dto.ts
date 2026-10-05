import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@servicedesk.local' })
  @IsEmail({}, { message: 'email ต้องเป็นรูปแบบอีเมลที่ถูกต้อง' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty({ message: 'password is required' })
  password: string;
}
