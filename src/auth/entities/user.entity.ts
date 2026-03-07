import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Property } from '../../property/entities/property.entity';
import { Notification } from '../../notification/entities/notification.entity';
import { Emergency } from '../../emergency/entities/emergency.entity';
import { Package } from '../../package/entities/package.entity';


@Entity( 'users' )
export class User {

  @PrimaryGeneratedColumn( 'uuid' )
  id: string;

  @Column( 'text', { default: () => 'CURRENT_TIMESTAMP', nullable: false } )
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

  @OneToMany(
    () => Property,
    property => property.user,
    { cascade: true }
  )
  property: Property;

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

  @BeforeInsert()
  checkFieldsBeforeInsert() {
    this.username = this.username.toLowerCase().trim();
  }

  @BeforeUpdate()
  checkFieldsBeforeUpdate() {
    this.checkFieldsBeforeInsert();
  }

}
