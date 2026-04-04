import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Property } from '../../property/entities/property.entity';

export enum InvoiceState {
  IN_PROGRESS = 'in_progress',
  CONFIRMED = 'confirmed'
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  title: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('text')
  invoiceUrl: string;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @Column({
    type: 'enum',
    enum: InvoiceState,
    default: InvoiceState.IN_PROGRESS
  })
  state: InvoiceState;

  @Column('boolean', { default: true })
  status: boolean;

  @ManyToOne(() => User, (user) => user.invoices, { eager: true })
  user: User;

  @ManyToOne(() => Property, { eager: true })
  property: Property;
}