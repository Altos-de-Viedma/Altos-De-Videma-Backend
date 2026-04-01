import { IsOptional, IsString, IsUUID, IsDateString, IsEmail, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVisitorDto {

  @ApiProperty({
    description: 'Property UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  property: string;

  @ApiProperty({
    description: 'Date and time of visit',
    example: '2025-03-15 14:30',
  })
  @IsString()
  @MaxLength(100)
  dateAndTimeOfVisit: string;

  @ApiProperty({
    description: 'Visitor full name',
    example: 'Juan Pérez',
    minLength: 3,
  })
  @IsString()
  @MaxLength(100)
  fullName: string;

  @ApiProperty({
    description: 'Visitor DNI (national ID)',
    example: '12345678',
  })
  @IsString()
  @MaxLength(20)
  dni: string;

  @ApiProperty({
    description: 'Visitor phone number',
    example: '+5491165627356',
  })
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiPropertyOptional({
    description: 'Additional description or notes',
    example: 'Visita para entregar documentación',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Profile picture URL',
    example: 'https://example.com/photo.jpg',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  profilePicture?: string;

  @ApiPropertyOptional({
    description: 'Vehicle license plate',
    example: 'AB123CD',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  vehiclePlate?: string;
}