import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Property } from '../../property/entities/property.entity';
import { User } from '../../auth/entities/user.entity';
import { Invoice } from '../../invoice/entities/invoice.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  OVERDUE = 'overdue'
}

@Entity('property_monthly_payments')
@Index(['property', 'year', 'month'], { unique: true })
export class PropertyMonthlyPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Property, { eager: true })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column('int')
  year: number;

  @Column('int')
  month: number; // 1-12

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  amountDue: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  amountPaid: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  status: PaymentStatus;

  @Column('timestamp', { nullable: true })
  paymentDate: Date;

  @ManyToOne(() => Invoice, { nullable: true })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'paid_by' })
  paidBy: User;

  @Column('text', { nullable: true })
  notes: string;

  @Column('boolean', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}