import { IsArray, IsString, IsEmail, IsOptional, Matches, MaxLength, MinLength, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {

  @ApiProperty({
    description: 'Username for login',
    example: 'mtoloza',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({
    description: 'User password (min 6 chars, must contain uppercase, lowercase and number)',
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

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+5491165627356',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/^[0-9+\-\s()]+$/, { message: 'Invalid phone number format' })
  phone: string;

  @ApiProperty({
    description: 'User address',
    example: 'Av. San Martín 1234',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  address: string;

  @ApiPropertyOptional({
    description: 'User roles (default: ["user"])',
    example: ['user'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  roles?: string[];

  @ApiPropertyOptional({
    description: 'Whether the user account is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}