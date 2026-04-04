import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Invoice, InvoiceState } from './entities/invoice.entity';
import { User } from '../auth/entities/user.entity';
import { Property } from '../property/entities/property.entity';

type ErrorType = 'NOT_FOUND' | 'INTERNAL_SERVER_ERROR' | 'FORBIDDEN';

// Función para obtener fecha actual en Buenos Aires
const getBuenosAiresDate = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
};

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto, user: User): Promise<Invoice> {
    const { propertyId, ...invoiceData } = createInvoiceDto;

    // Find the property
    const property = await this.handleDatabaseOperation(() =>
      this.propertyRepository.findOne({
        where: { id: propertyId, status: true }
      })
    );

    if (!property) {
      this.handleError('NOT_FOUND', `Property with ID ${propertyId} not found.`);
    }

    const invoice = this.invoiceRepository.create({
      ...invoiceData,
      user,
      property,
      date: getBuenosAiresDate(),
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

  async confirmInvoice(id: string, user: User, authHeader?: string): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (!invoice) {
      this.handleError('NOT_FOUND', `Invoice with ID ${id} not found.`);
    }

    // Only admin or security can confirm invoices
    if (!user.roles.includes('admin') && !user.roles.includes('security')) {
      this.handleError('FORBIDDEN', 'You are not authorized to confirm this invoice.');
    }

    invoice.state = InvoiceState.CONFIRMED;
    const updatedInvoice = await this.handleDatabaseOperation(() => this.invoiceRepository.save(invoice));

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