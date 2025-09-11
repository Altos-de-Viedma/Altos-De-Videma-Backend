import { IsOptional, IsString, IsUUID, IsDate } from 'class-validator';

export class CreatePackageDto {
  @IsString()
  arrivalDate: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsUUID()
  propertyId: string;


  // TODO: FALTA FECHA DE RECIBIR PAQUETE
}