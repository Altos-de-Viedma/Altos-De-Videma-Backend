import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PropertyMonthlyPaymentsService } from './property-monthly-payments.service';
import { PropertyMonthlyPaymentsController } from './property-monthly-payments.controller';
import { PropertyMonthlyPayment } from './entities/property-monthly-payment.entity';
import { Property } from '../property/entities/property.entity';
import { User } from '../auth/entities/user.entity';
import { Invoice } from '../invoice/entities/invoice.entity';

@Module({
  controllers: [PropertyMonthlyPaymentsController],
  providers: [PropertyMonthlyPaymentsService],
  imports: [
    TypeOrmModule.forFeature([
      PropertyMonthlyPayment,
      Property,
      User,
      Invoice
    ])
  ],
  exports: [PropertyMonthlyPaymentsService]
})
export class PropertyMonthlyPaymentsModule {}