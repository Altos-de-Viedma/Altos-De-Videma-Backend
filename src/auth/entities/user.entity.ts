import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Property } from '../../property/entities/property.entity';
import { Notification } from '../../notification/entities/notification.entity';
import { Emergency } from '../../emergency/entities/emergency.entity';
import { Package } from '../../package/entities/package.entity';
import { Invoice } from '../../invoice/entities/invoice.entity';

// Función para obtener fecha actual en Buenos Aires
const getBuenosAiresDate = (): string => {
  return new Date().toLocaleString('sv-SE', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(' ', 'T');
};

@Entity( 'users' )
export class User {

  @PrimaryGeneratedColumn( 'uuid' )
  id: string;

  @Column( 'text', { nullable: false } )
  creationDate: string;

  @Column( 'timestamp', { nullable: true } )
  lastActivity: Date;

  @Column( 'boolean', { default: true, nullable: false } )
  isActive: boolean;

  @Column( 'text', { unique: true, nullable: false } )
  username: string;

  @Column( 'text', { select: false, nullable: false } )
  password: string;

  @Column( 'text', { nullable: false } )
  name: string;

  @Column( 'text', { nullable: false } )
  lastName: string;

  @Column( 'text', { nullable: true } )
  phone: string;

  @Column( 'text', { nullable: true } )
  address: string;

  @Column( 'text', { array: true, default: [ 'user' ] } )
  roles: string[];

  @ManyToMany(
    () => Property,
    property => property.users
  )
  properties: Property[];

  @OneToMany(
    () => Emergency,
    emergency => emergency.user,
    { cascade: true }
  )
  emergency: Emergency;

  @OneToMany(
    () => Package,
    packageData => packageData.user,
    { cascade: true }
  )
  package: Package;

  @OneToMany(
    () => Notification,
    notification => notification.user,
    { cascade: true }
  )
  notification: Notification;

  @OneToMany(
    () => Invoice,
    invoice => invoice.user,
    { cascade: true }
  )
  invoices: Invoice;

  @BeforeInsert()
  checkFieldsBeforeInsert() {
    this.username = this.username.toLowerCase().trim();
    // Establecer fecha de creación en hora de Buenos Aires
    if (!this.creationDate) {
      this.creationDate = getBuenosAiresDate();
    }
  }

  @BeforeUpdate()
  checkFieldsBeforeUpdate() {
    this.checkFieldsBeforeInsert();
    // Actualizar última actividad en hora de Buenos Aires
    this.lastActivity = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
  }

}
