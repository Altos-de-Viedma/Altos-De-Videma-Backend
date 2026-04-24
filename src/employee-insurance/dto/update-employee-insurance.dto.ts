import { PartialType } from '@nestjs/swagger';
import { CreateEmployeeInsuranceDto } from './create-employee-insurance.dto';

export class UpdateEmployeeInsuranceDto extends PartialType(CreateEmployeeInsuranceDto) {}
