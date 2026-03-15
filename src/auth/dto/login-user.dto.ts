import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: 'User password',
    example: 'Password123',
    minLength: 6,
    maxLength: 50,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(
    /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
    { message: 'The password must contain at least one uppercase letter, one lowercase letter, and one number' }
  )
  password: string;
}