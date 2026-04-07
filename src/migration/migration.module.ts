import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceMigrationService } from './invoice-migration.service';
import { InvoiceMigrationController } from './invoice-migration.controller';
import { Invoice } from '../invoice/entities/invoice.entity';
import { Property } from '../property/entities/property.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Property])],
  providers: [InvoiceMigrationService],
  controllers: [InvoiceMigrationController],
  exports: [InvoiceMigrationService],
})
export class MigrationModule {}