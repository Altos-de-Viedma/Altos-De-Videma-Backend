import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../invoice/entities/invoice.entity';
import { Property } from '../property/entities/property.entity';

@Injectable()
export class InvoiceMigrationService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
  ) {}

  async fixExistingInvoices(): Promise<void> {
    console.log('🔄 Starting invoice migration...');

    // Get all invoices with their properties and users
    const invoices = await this.invoiceRepository.find({
      relations: ['property', 'property.users', 'user'],
      where: { status: true }
    });

    console.log(`📋 Found ${invoices.length} invoices to process`);

    let fixed = 0;
    let errors = 0;

    for (const invoice of invoices) {
      try {
        if (!invoice.property) {
          console.log(`⚠️  Invoice ${invoice.id} has no property, skipping`);
          continue;
        }

        // Get property with users
        const property = await this.propertyRepository.findOne({
          where: { id: invoice.property.id },
          relations: ['users']
        });

        if (!property || !property.users || property.users.length === 0) {
          console.log(`⚠️  Property ${invoice.property.id} has no users, skipping invoice ${invoice.id}`);
          continue;
        }

        // Get the first user of the property (property owner)
        const propertyOwner = property.users[0];

        // Check if invoice is already assigned to the correct owner
        if (invoice.user.id === propertyOwner.id) {
          console.log(`✅ Invoice ${invoice.id} already assigned correctly to ${propertyOwner.name}`);
          continue;
        }

        // Update the invoice to assign it to the property owner
        await this.invoiceRepository.update(invoice.id, {
          user: propertyOwner
        });

        console.log(`🔧 Fixed invoice ${invoice.id}: "${invoice.title}" -> assigned to ${propertyOwner.name} ${propertyOwner.lastName}`);
        fixed++;

      } catch (error) {
        console.error(`❌ Error processing invoice ${invoice.id}:`, error);
        errors++;
      }
    }

    console.log(`\n📊 Migration completed:`);
    console.log(`   ✅ Fixed: ${fixed} invoices`);
    console.log(`   ❌ Errors: ${errors} invoices`);
    console.log(`   📋 Total processed: ${invoices.length} invoices`);
  }
}