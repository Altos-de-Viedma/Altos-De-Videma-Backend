import { IsOptional, IsString, IsUUID } from 'class-validator';


export class CreateVisitorDto {

  @IsUUID()
  property: string;

  @IsString()
  dateAndTimeOfVisit: string;

  @IsString()
  fullName: string;

  @IsString()
  dni: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  profilePicture?: string;

  @IsString()
  @IsOptional()
  vehiclePlate?: string;
}