import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { CreatePropertyMonthlyPaymentDto } from './dto/create-property-monthly-payment.dto';
import { UpdatePropertyMonthlyPaymentDto } from './dto/update-property-monthly-payment.dto';
import { PropertyMonthlyPayment, PaymentStatus } from './entities/property-monthly-payment.entity';
import { Property } from '../property/entities/property.entity';
import { User } from '../auth/entities/user.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import { BuenosAiresDateUtils } from '../common/utils/buenos-aires-date.utils';

type ErrorType = 'NOT_FOUND' | 'BAD_REQUEST' | 'INTERNAL_SERVER_ERROR';

export interface MonthlyPaymentSummary {
  year: number;
  month: number;
  totalProperties: number;
  paidProperties: number;
  pendingProperties: number;
  overdueProperties: number;
  totalAmountDue: number;
  totalAmountPaid: number;
  paymentPercentage: number;
}

export interface PropertyPaymentStatus {
  property: Property;
  payments: PropertyMonthlyPayment[];
  currentMonthStatus: PaymentStatus;
  totalOwed: number;
  totalPaid: number;
}

@Injectable()
export class PropertyMonthlyPaymentsService {
  constructor(
    @InjectRepository(PropertyMonthlyPayment)
    private readonly paymentRepository: Repository<PropertyMonthlyPayment>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {}

  async create(createDto: CreatePropertyMonthlyPaymentDto): Promise<PropertyMonthlyPayment> {
    const property = await this.propertyRepository.findOne({
      where: { id: createDto.propertyId, status: true }
    });

    if (!property) {
      this.handleError('NOT_FOUND', `Property with ID ${createDto.propertyId} not found.`);
    }

    // Check if payment record already exists for this property/month/year
    const existingPayment = await this.paymentRepository.findOne({
      where: {
        property: { id: createDto.propertyId },
        year: createDto.year,
        month: createDto.month
      }
    });

    if (existingPayment) {
      this.handleError('BAD_REQUEST', `Payment record already exists for this property in ${createDto.month}/${createDto.year}.`);
    }

    const payment = this.paymentRepository.create({
      property,
      year: createDto.year,
      month: createDto.month,
      amountDue: createDto.amountDue,
      amountPaid: createDto.amountPaid || 0,
      status: createDto.status || PaymentStatus.PENDING,
      notes: createDto.notes
    });

    // Update status based on payment amount
    this.updatePaymentStatus(payment);

    return this.handleDatabaseOperation(() => this.paymentRepository.save(payment));
  }

  async findAll(): Promise<PropertyMonthlyPayment[]> {
    return this.handleDatabaseOperation(() =>
      this.paymentRepository.find({
        where: { isActive: true },
        relations: ['property', 'invoice', 'paidBy'],
        order: { year: 'DESC', month: 'DESC', createdAt: 'DESC' }
      })
    );
  }

  async findByMonth(year: number, month: number): Promise<PropertyMonthlyPayment[]> {
    return this.handleDatabaseOperation(() =>
      this.paymentRepository.find({
        where: { year, month, isActive: true },
        relations: ['property', 'invoice', 'paidBy'],
        order: { property: { address: 'ASC' } }
      })
    );
  }

  async findByProperty(propertyId: string): Promise<PropertyMonthlyPayment[]> {
    return this.handleDatabaseOperation(() =>
      this.paymentRepository.find({
        where: { property: { id: propertyId }, isActive: true },
        relations: ['property', 'invoice', 'paidBy'],
        order: { year: 'DESC', month: 'DESC' }
      })
    );
  }

  async getMonthlyPaymentSummary(year: number, month: number): Promise<MonthlyPaymentSummary> {
    const payments = await this.findByMonth(year, month);

    const totalProperties = payments.length;
    const paidProperties = payments.filter(p => p.status === PaymentStatus.PAID).length;
    const pendingProperties = payments.filter(p => p.status === PaymentStatus.PENDING).length;
    const overdueProperties = payments.filter(p => p.status === PaymentStatus.OVERDUE).length;

    const totalAmountDue = payments.reduce((sum, p) => sum + Number(p.amountDue), 0);
    const totalAmountPaid = payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);

    const paymentPercentage = totalProperties > 0 ? (paidProperties / totalProperties) * 100 : 0;

    return {
      year,
      month,
      totalProperties,
      paidProperties,
      pendingProperties,
      overdueProperties,
      totalAmountDue,
      totalAmountPaid,
      paymentPercentage
    };
  }

  async getPropertyPaymentStatus(propertyId: string): Promise<PropertyPaymentStatus> {
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId, status: true }
    });

    if (!property) {
      this.handleError('NOT_FOUND', `Property with ID ${propertyId} not found.`);
    }

    const payments = await this.findByProperty(propertyId);
    const currentDate = BuenosAiresDateUtils.now();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const currentMonthPayment = payments.find(p => p.year === currentYear && p.month === currentMonth);
    const currentMonthStatus = currentMonthPayment?.status || PaymentStatus.PENDING;

    const totalOwed = payments.reduce((sum, p) => sum + Number(p.amountDue), 0);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);

    return {
      property,
      payments,
      currentMonthStatus,
      totalOwed,
      totalPaid
    };
  }

  async markPropertiesAsPaid(propertyIds: string[], amount: number, invoice: Invoice, paidBy: User): Promise<void> {
    const paymentDate = invoice?.date || BuenosAiresDateUtils.now();
    const year = paymentDate.getFullYear();
    const month = paymentDate.getMonth() + 1;

    for (const propertyId of propertyIds) {
      // Find or create payment record for current month
      let payment = await this.paymentRepository.findOne({
        where: {
          property: { id: propertyId },
          year,
          month
        }
      });

      if (!payment) {
        // Create new payment record if it doesn't exist
        const property = await this.propertyRepository.findOne({
          where: { id: propertyId, status: true }
        });

        if (property) {
          payment = this.paymentRepository.create({
            property,
            year,
            month,
            amountDue: amount, // You might want to set a default monthly amount
            amountPaid: 0,
            status: PaymentStatus.PENDING
          });
        }
      }

      if (payment) {
        // Update payment record
        payment.amountPaid = Number(payment.amountPaid) + amount;
        payment.invoice = invoice;
        payment.paidBy = paidBy;
        payment.paymentDate = paymentDate;

        // Update status based on payment
        this.updatePaymentStatus(payment);

        await this.handleDatabaseOperation(() => this.paymentRepository.save(payment));
      }
    }
  }

  async initializeMonthlyPayments(year: number, month: number, defaultAmount: number = 0): Promise<void> {
    // Get all active properties
    const properties = await this.propertyRepository.find({
      where: { status: true }
    });

    for (const property of properties) {
      // Check if payment record already exists
      const existingPayment = await this.paymentRepository.findOne({
        where: {
          property: { id: property.id },
          year,
          month
        }
      });

      if (!existingPayment) {
        const payment = this.paymentRepository.create({
          property,
          year,
          month,
          amountDue: defaultAmount,
          amountPaid: 0,
          status: PaymentStatus.PENDING
        });

        await this.handleDatabaseOperation(() => this.paymentRepository.save(payment));
      }
    }
  }

  async update(id: string, updateDto: UpdatePropertyMonthlyPaymentDto): Promise<PropertyMonthlyPayment> {
    const payment = await this.paymentRepository.findOne({
      where: { id, isActive: true },
      relations: ['property', 'invoice', 'paidBy']
    });

    if (!payment) {
      this.handleError('NOT_FOUND', `Payment record with ID ${id} not found.`);
    }

    // Update fields
    if (updateDto.amountPaid !== undefined) {
      payment.amountPaid = updateDto.amountPaid;
    }
    if (updateDto.status !== undefined) {
      payment.status = updateDto.status;
    }
    if (updateDto.notes !== undefined) {
      payment.notes = updateDto.notes;
    }

    // Update status based on payment amount if amount changed
    if (updateDto.amountPaid !== undefined) {
      this.updatePaymentStatus(payment);
    }

    return this.handleDatabaseOperation(() => this.paymentRepository.save(payment));
  }

  async remove(id: string): Promise<PropertyMonthlyPayment> {
    const payment = await this.paymentRepository.findOne({
      where: { id, isActive: true }
    });

    if (!payment) {
      this.handleError('NOT_FOUND', `Payment record with ID ${id} not found.`);
    }

    payment.isActive = false;
    return this.handleDatabaseOperation(() => this.paymentRepository.save(payment));
  }

  private updatePaymentStatus(payment: PropertyMonthlyPayment): void {
    const amountPaid = Number(payment.amountPaid);
    const amountDue = Number(payment.amountDue);

    if (amountPaid >= amountDue && amountDue > 0) {
      payment.status = PaymentStatus.PAID;
    } else if (amountPaid > 0 && amountPaid < amountDue) {
      payment.status = PaymentStatus.PARTIAL;
    } else {
      // Check if overdue (current logic can be enhanced)
      const currentDate = BuenosAiresDateUtils.now();
      const paymentMonth = new Date(payment.year, payment.month - 1);
      const isOverdue = currentDate > paymentMonth && amountPaid === 0;

      payment.status = isOverdue ? PaymentStatus.OVERDUE : PaymentStatus.PENDING;
    }
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
      case 'BAD_REQUEST':
        throw new BadRequestException(message);
      case 'INTERNAL_SERVER_ERROR':
        throw new InternalServerErrorException(message);
      default:
        throw new InternalServerErrorException('An unexpected error occurred.');
    }
  }
}