import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { AuthModule } from '../auth/auth.module';
import { Invoice } from './entities/invoice.entity';
import { User } from '../auth/entities/user.entity';
import { Property } from '../property/entities/property.entity';

@Module({
  controllers: [InvoiceController],
  providers: [InvoiceService],
  imports: [
    TypeOrmModule.forFeature([Invoice, User, Property]),
    AuthModule,
    HttpModule
  ]
})
export class InvoiceModule {}