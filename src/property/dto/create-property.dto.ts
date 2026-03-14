import { IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';


export class CreatePropertyDto {

  @IsUUID()
  @IsString()
  user: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}
