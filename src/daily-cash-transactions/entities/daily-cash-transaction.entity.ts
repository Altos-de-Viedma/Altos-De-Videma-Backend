import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum TransactionType {
  ENTRY = 'entry',
  EXIT = 'exit'
}

export enum TransactionCategory {
  CONSTRUCTION_MATERIALS = 'construction_materials',
  SALARY_PAYMENTS = 'salary_payments',
  ELECTRICITY_SERVICE = 'electricity_service',
  WATER_SERVICE = 'water_service',
  GAS_SERVICE = 'gas_service',
  INTERNET_SERVICE = 'internet_service',
  SECURITY_SERVICE = 'security_service',
  CLEANING_SERVICE = 'cleaning_service',
  MAINTENANCE = 'maintenance',
  OFFICE_SUPPLIES = 'office_supplies',
  FUEL = 'fuel',
  INSURANCE = 'insurance',
  TAXES = 'taxes',
  BANK_FEES = 'bank_fees',
  OTHER_INCOME = 'other_income',
  OTHER_EXPENSE = 'other_expense'
}

@Entity('daily_cash_transactions')
export class DailyCashTransaction {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransactionType
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionCategory
  })
  category: TransactionCategory;

  @Column('text', { nullable: true })
  description: string;

  @Column('date')
  transactionDate: Date;

  @Column('boolean', { default: true })
  isActive: boolean;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
