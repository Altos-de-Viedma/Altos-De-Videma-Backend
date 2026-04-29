import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { ConfirmInvoiceDto } from './dto/confirm-invoice.dto';
import { Invoice, InvoiceState } from './entities/invoice.entity';
import { User } from '../auth/entities/user.entity';
import { Property } from '../property/entities/property.entity';
import { DailyCashTransactionsService } from '../daily-cash-transactions/daily-cash-transactions.service';
import { TransactionType, TransactionCategory } from '../daily-cash-transactions/entities/daily-cash-transaction.entity';
import { BuenosAiresDateUtils } from '../common/utils/buenos-aires-date.utils';

type ErrorType = 'NOT_FOUND' | 'INTERNAL_SERVER_ERROR' | 'FORBIDDEN';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly dailyCashTransactionsService: DailyCashTransactionsService,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto, user: User): Promise<Invoice> {
    const { propertyId, ...invoiceData } = createInvoiceDto;

    // Find the property with its users
    const property = await this.handleDatabaseOperation(() =>
      this.propertyRepository.findOne({
        where: { id: propertyId, status: true },
        relations: ['users']
      })
    );

    if (!property) {
      this.handleError('NOT_FOUND', `Property with ID ${propertyId} not found.`);
    }

    // Find the property owner (first user associated with the property)
    if (!property.users || property.users.length === 0) {
      this.handleError('NOT_FOUND', `No owner found for property ${propertyId}.`);
    }

    const propertyOwner = property.users[0]; // Assign to first user of the property

    const invoice = this.invoiceRepository.create({
      ...invoiceData,
      user: propertyOwner, // Assign to property owner, not the admin creating it
      property,
      date: BuenosAiresDateUtils.now(),
    });
    return this.handleDatabaseOperation(() => this.invoiceRepository.save(invoice));
  }

  async findAll(): Promise<Invoice[]> {
    return this.handleDatabaseOperation(() =>
      this.invoiceRepository.find({
        where: { status: true },
        relations: {
          property: {
            users: true
          }
        },
        order: {
          date: 'DESC'
        }
      })
    );
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.handleDatabaseOperation(() =>
      this.invoiceRepository.findOne({
        where: {
          id,
          status: true
        }
      })
    );

    if (!invoice) {
      this.handleError('NOT_FOUND', `Invoice with ID ${id} not found.`);
    }

    return invoice;
  }

  async findByUser(userId: string): Promise<Invoice[]> {
    return this.handleDatabaseOperation(() =>
      this.invoiceRepository.find({
        where: {
          user: { id: userId },
          status: true
        },
        relations: {
          property: {
            users: true
          }
        },
        order: {
          date: 'DESC'
        }
      })
    );
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto, user: User): Promise<Invoice> {
    const invoice = await this.findOne(id);

    // Only admin can update any invoice, users can only update their own
    if (invoice.user.id !== user.id && !user.roles.includes('admin')) {
      this.handleError('FORBIDDEN', 'You are not authorized to update this invoice.');
    }

    const updatedInvoice = Object.assign(invoice, updateInvoiceDto);
    return this.handleDatabaseOperation(() => this.invoiceRepository.save(updatedInvoice));
  }

  async confirmInvoice(id: string, confirmInvoiceDto: ConfirmInvoiceDto, user: User): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (!invoice) {
      this.handleError('NOT_FOUND', `Invoice with ID ${id} not found.`);
    }

    // Only admin or security can confirm invoices
    if (!user.roles.includes('admin') && !user.roles.includes('security')) {
      this.handleError('FORBIDDEN', 'You are not authorized to confirm this invoice.');
    }

    // Get selected properties
    const { amount, propertyIds } = confirmInvoiceDto;
    let selectedProperties: Property[] = [];

    if (propertyIds && propertyIds.length > 0) {
      selectedProperties = await this.propertyRepository.findByIds(propertyIds);
    }

    // Confirm the invoice and save selected properties
    invoice.state = InvoiceState.CONFIRMED;
    invoice.selectedProperties = selectedProperties;
    const updatedInvoice = await this.handleDatabaseOperation(() => this.invoiceRepository.save(invoice));

    // Get property owner info for description
    const propertyOwner = invoice.property?.users?.[0];
    const ownerName = propertyOwner
      ? `${propertyOwner.name} ${propertyOwner.lastName}`
      : 'Propietario desconocido';

    // Create description based on selected properties
    let description = `Expensas de ${ownerName}`;
    if (selectedProperties.length > 0) {
      const addresses = selectedProperties.map(p => p.address).join(', ');
      description = `Expensas de ${addresses} - ${ownerName}`;
    }

    // Create the cash transaction
    await this.dailyCashTransactionsService.create({
      amount,
      type: TransactionType.ENTRY,
      category: TransactionCategory.OTHER_INCOME,
      description,
      propertyIds
    }, user);

    return updatedInvoice;
  }


  async remove(id: string, user: User): Promise<Invoice> {
    const invoice = await this.findOne(id);

    // Only admin can delete any invoice, users can only delete their own
    if (invoice.user.id !== user.id && !user.roles.includes('admin')) {
      this.handleError('FORBIDDEN', 'You are not authorized to delete this invoice.');
    }

    invoice.status = false;
    return this.handleDatabaseOperation(() => this.invoiceRepository.save(invoice));
  }

  private async handleDatabaseOperation<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handleError('INTERNAL_SERVER_ERROR', 'Unable to perform the database operation.');
    }
  }

  private handleError(type: ErrorType, message: string): never {
    switch (type) {
      case 'NOT_FOUND':
        throw new NotFoundException(message);
      case 'FORBIDDEN':
        throw new ForbiddenException(message);
      case 'INTERNAL_SERVER_ERROR':
        throw new InternalServerErrorException(message);
      default:
        throw new InternalServerErrorException('An unexpected error occurred.');
    }
  }
}