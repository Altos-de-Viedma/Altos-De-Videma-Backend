import { IsOptional, IsString, IsUUID, IsBoolean, IsArray, ArrayMinSize } from 'class-validator';


export class CreatePropertyDto {

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1, { message: 'La propiedad debe tener al menos un propietario' })
  users: string[];

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}
