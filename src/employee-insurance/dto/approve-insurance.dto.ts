import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveInsuranceDto {
  @ApiProperty({ description: 'Notas de aprobación', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
