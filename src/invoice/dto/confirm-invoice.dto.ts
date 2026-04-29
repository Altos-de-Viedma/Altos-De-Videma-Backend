import { IsNumber, IsArray, IsUUID, Min, IsOptional } from 'class-validator';

export class ConfirmInvoiceDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Cada ID de propiedad debe ser un UUID válido' })
  propertyIds?: string[];
}