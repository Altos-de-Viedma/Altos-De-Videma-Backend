import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { ConfirmInvoiceDto } from './dto/confirm-invoice.dto';
import { BulkCreateInvoiceDto } from './dto/bulk-create-invoice.dto';
import { Invoice, InvoiceState } from './entities/invoice.entity';
import { User } from '../auth/entities/user.entity';
import { Property } from '../property/entities/property.entity';
import { DailyCashTransactionsService } from '../daily-cash-transactions/daily-cash-transactions.service';
import { PropertyMonthlyPaymentsService } from '../property-monthly-payments/property-monthly-payments.service';
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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly dailyCashTransactionsService: DailyCashTransactionsService,
    private readonly propertyMonthlyPaymentsService: PropertyMonthlyPaymentsService,
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
        },
        relations: {
          property: {
            users: true
          },
          user: true
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

    // Get all properties of the invoice user to find the main property owner
    const userProperties = await this.propertyRepository.find({
      where: {
        users: { id: invoice.user.id }
      },
      relations: ['users']
    });

    // Find the main property to get the correct owner name
    const mainProperty = userProperties.find(p => p.isMain);
    let ownerName = 'Propietario desconocido';

    if (mainProperty && mainProperty.users && mainProperty.users.length > 0) {
      const mainPropertyOwner = mainProperty.users[0];
      ownerName = `${mainPropertyOwner.name} ${mainPropertyOwner.lastName}`;
    } else if (invoice.user) {
      // Fallback to invoice user if no main property found
      ownerName = `${invoice.user.name} ${invoice.user.lastName}`;
    }

    // Create description based on selected properties
    let description = `Expensas de ${ownerName}`;
    if (selectedProperties.length > 0) {
      const propertyNames = selectedProperties.map(p => p.address || p.description || 'Propiedad').join(' - ');
      description = `Expensas de ${propertyNames} - ${ownerName}`;
    }

    // Create the cash transaction
    await this.dailyCashTransactionsService.create({
      amount,
      type: TransactionType.ENTRY,
      category: TransactionCategory.OTHER_INCOME,
      description,
      propertyIds
    }, user);

    // Mark properties as paid for current month in the monthly payments system
    if (propertyIds && propertyIds.length > 0) {
      await this.propertyMonthlyPaymentsService.markPropertiesAsPaid(
        propertyIds,
        amount,
        updatedInvoice,
        user
      );
    }

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

  async bulkCreate(bulkCreateInvoiceDto: BulkCreateInvoiceDto, adminUser: User): Promise<{ results: any[] }> {
    // Only admin can do bulk create
    if (!adminUser.roles.includes('admin')) {
      this.handleError('FORBIDDEN', 'Solo administradores pueden crear facturas masivas.');
    }

    const results = [];

    for (const item of bulkCreateInvoiceDto.items) {
      try {
        // Get last 8 digits of the phone
        const cleanPhone = item.phone.replace(/[\s\-\(\)]/g, '');
        const last8Digits = cleanPhone.slice(-8);

        // Find user by phone
        const user = await this.userRepository
          .createQueryBuilder('user')
          .leftJoinAndSelect('user.properties', 'properties')
          .where('user.phone LIKE :phone', { phone: `%${last8Digits}` })
          .andWhere('user.isActive = :isActive', { isActive: true })
          .getOne();

        if (!user) {
          results.push({
            phone: item.phone,
            name: item.name,
            success: false,
            error: `No se encontró usuario con teléfono terminado en ${last8Digits}`
          });
          continue;
        }

        // Find main property
        const mainProperty = user.properties?.find(p => p.isMain && p.status);

        if (!mainProperty) {
          results.push({
            phone: item.phone,
            name: item.name,
            userName: `${user.name} ${user.lastName}`,
            success: false,
            error: `No se encontró propiedad principal para ${user.name} ${user.lastName}`
          });
          continue;
        }

        const ownerName = `${user.name} ${user.lastName}`;
        const description = `Expensas de ${ownerName}`;

        // Create the invoice as confirmed
        const invoice = this.invoiceRepository.create({
          title: `Expensas de ${ownerName}`,
          description,
          invoiceUrl: item.invoiceUrl,
          user: user,
          property: mainProperty,
          selectedProperties: [mainProperty],
          date: BuenosAiresDateUtils.now(),
          state: InvoiceState.CONFIRMED,
        });
        const savedInvoice = await this.invoiceRepository.save(invoice);

        // Create cash transaction
        await this.dailyCashTransactionsService.create({
          amount: item.amount,
          type: TransactionType.ENTRY,
          category: TransactionCategory.OTHER_INCOME,
          description: `Expensas de ${mainProperty.address} - ${ownerName}`,
          propertyIds: [mainProperty.id]
        }, adminUser);

        // Mark property as paid
        await this.propertyMonthlyPaymentsService.markPropertiesAsPaid(
          [mainProperty.id],
          item.amount,
          savedInvoice,
          adminUser
        );

        results.push({
          phone: item.phone,
          name: item.name,
          userName: ownerName,
          propertyAddress: mainProperty.address,
          amount: item.amount,
          invoiceId: savedInvoice.id,
          success: true
        });

      } catch (error) {
        results.push({
          phone: item.phone,
          name: item.name,
          success: false,
          error: error.message || 'Error desconocido'
        });
      }
    }

    return { results };
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