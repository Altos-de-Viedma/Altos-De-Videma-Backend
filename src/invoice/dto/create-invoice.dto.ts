import { IsNotEmpty, IsOptional, IsString, IsUrl, Matches } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(
    /^https?:\/\/.+/,
    { message: 'La URL debe comenzar con http:// o https://' }
  )
  invoiceUrl: string;
}