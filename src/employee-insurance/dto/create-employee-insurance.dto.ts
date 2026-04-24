import { IsString, IsEnum, IsDecimal, IsDateString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InsuranceStatus } from '../entities/employee-insurance.entity';

export class CreateEmployeeInsuranceDto {
  @ApiProperty({ description: 'Nombre completo del empleado', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  employeeName: string;

  @ApiProperty({ description: 'Posición/cargo del empleado', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  employeePosition: string;

  @ApiProperty({ description: 'Documento de identidad del empleado', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  employeeDocument: string;

  @ApiProperty({ description: 'Teléfono del empleado', maxLength: 15 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  employeePhone: string;



  @ApiProperty({ description: 'Compañía de seguros', maxLength: 100, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  insuranceCompany?: string;

  @ApiProperty({ description: 'Número de póliza', maxLength: 50, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  policyNumber?: string;

  @ApiProperty({ description: 'Monto de cobertura', required: false })
  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  coverageAmount?: number;

  @ApiProperty({ description: 'Prima mensual', required: false })
  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  monthlyPremium?: number;

  @ApiProperty({ description: 'Fecha de inicio del seguro', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'Fecha de expiración del seguro' })
  @IsDateString()
  expirationDate: string;

  @ApiProperty({ description: 'Estado del seguro', enum: InsuranceStatus, required: false })
  @IsOptional()
  @IsEnum(InsuranceStatus)
  status?: InsuranceStatus;

  @ApiProperty({ description: 'URL del comprobante del seguro', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  proofUrl: string;

  @ApiProperty({ description: 'ID de la propiedad asociada', required: false })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiProperty({ description: 'Notas adicionales', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
