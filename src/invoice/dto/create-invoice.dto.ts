import { IsNotEmpty, IsOptional, IsString, IsUrl, Matches, IsUUID } from 'class-validator';

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

  @IsUUID()
  @IsNotEmpty()
  propertyId: string;
}