import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Property } from '../../property/entities/property.entity';


export enum InsuranceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  EXPIRED = 'expired'
}

@Entity('employee_insurance')
export class EmployeeInsurance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 100 })
  employeeName: string;

  @Column('varchar', { length: 50 })
  employeePosition: string;

  @Column('varchar', { length: 20 })
  employeeDocument: string;

  @Column('varchar', { length: 15 })
  employeePhone: string;



  @Column('varchar', { length: 100, nullable: true })
  insuranceCompany: string;

  @Column('varchar', { length: 50, nullable: true })
  policyNumber: string;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  coverageAmount: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  monthlyPremium: number;

  @Column('date', { nullable: true })
  startDate: Date;

  @Column('date')
  expirationDate: Date;

  @Column({
    type: 'enum',
    enum: InsuranceStatus,
    default: InsuranceStatus.ACTIVE
  })
  status: InsuranceStatus;

  @Column('varchar', { length: 500 })
  proofUrl: string;

  @ManyToOne(() => Property, { nullable: true })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column('uuid', { nullable: true })
  propertyId: string;

  @Column('text', { nullable: true })
  notes: string;

  @Column('boolean', { default: true })
  isActive: boolean;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual property to check if expired
  get isExpired(): boolean {
    return new Date() > new Date(this.expirationDate);
  }
}
