import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, IsUUID, Min, Max } from 'class-validator';
import { PaymentStatus } from '../entities/property-monthly-payment.entity';

export class CreatePropertyMonthlyPaymentDto {
  @IsNotEmpty()
  @IsUUID()
  propertyId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(2020)
  year: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amountDue: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amountPaid?: number;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}