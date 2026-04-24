import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectInsuranceDto {
  @ApiProperty({ description: 'Motivo del rechazo' })
  @IsString()
  @IsNotEmpty({ message: 'El motivo del rechazo es obligatorio' })
  rejectionReason: string;
}
