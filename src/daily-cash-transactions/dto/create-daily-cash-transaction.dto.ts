import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, IsArray, IsUUID } from 'class-validator';
import { TransactionType, TransactionCategory } from '../entities/daily-cash-transaction.entity';

export class CreateDailyCashTransactionDto {

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount: number;

  @IsEnum(TransactionType, { message: 'El tipo debe ser entrada o salida' })
  type: TransactionType;

  @IsEnum(TransactionCategory, { message: 'Debe seleccionar una categoría válida' })
  category: TransactionCategory;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Cada ID de propiedad debe ser un UUID válido' })
  propertyIds?: string[];

  @IsOptional()
  transactionDate?: Date | string;
}
