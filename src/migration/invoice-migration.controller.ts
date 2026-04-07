import { Controller, Post } from '@nestjs/common';
import { InvoiceMigrationService } from './invoice-migration.service';

@Controller('migration')
export class InvoiceMigrationController {
  constructor(private readonly migrationService: InvoiceMigrationService) {}

  @Post('fix-invoices')
  async fixExistingInvoices() {
    await this.migrationService.fixExistingInvoices();
    return {
      message: 'Invoice migration completed successfully',
      status: 'success'
    };
  }
}