import { PartialType } from '@nestjs/mapped-types';
import { CreatePropertyMonthlyPaymentDto } from './create-property-monthly-payment.dto';
import { IsOptional, IsNumber, IsEnum, IsString, IsUUID, Min } from 'class-validator';
import { PaymentStatus } from '../entities/property-monthly-payment.entity';

export class UpdatePropertyMonthlyPaymentDto extends PartialType(CreatePropertyMonthlyPaymentDto) {
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