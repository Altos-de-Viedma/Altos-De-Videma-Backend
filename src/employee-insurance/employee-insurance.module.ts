import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmployeeInsuranceService } from './employee-insurance.service';
import { EmployeeInsuranceController } from './employee-insurance.controller';
import { EmployeeInsurance } from './entities/employee-insurance.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [EmployeeInsuranceController],
  providers: [EmployeeInsuranceService],
  imports: [
    TypeOrmModule.forFeature([EmployeeInsurance]),
    AuthModule
  ],
  exports: [EmployeeInsuranceService]
})
export class EmployeeInsuranceModule {}
