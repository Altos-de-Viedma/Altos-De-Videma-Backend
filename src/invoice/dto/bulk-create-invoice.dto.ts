import { IsArray, ValidateNested, IsString, IsNotEmpty, IsNumber, Min, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkInvoiceItemDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  date: string; // DD-MM-YYYY format

  @IsString()
  @IsNotEmpty()
  @Matches(/^https?:\/\/.+/, { message: 'La URL debe comenzar con http:// o https://' })
  invoiceUrl: string;
}

export class BulkCreateInvoiceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkInvoiceItemDto)
  items: BulkInvoiceItemDto[];
}
