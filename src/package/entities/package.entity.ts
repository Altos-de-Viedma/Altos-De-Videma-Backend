import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from '../../auth/entities/user.entity';
import { Property } from '../../property/entities/property.entity';

@Entity()
export class Package {
  @PrimaryGeneratedColumn( 'uuid' )
  id: string;

  @Column( 'boolean', { default: true } )
  status: boolean;

  @Column( 'boolean', { default: false } )
  received: boolean;

  @CreateDateColumn( { type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' } )
  date: Date;

  @ManyToOne( () => User, user => user.notification, { eager: true } )
  user: User;

  @Column( 'text', { default: '' } )
  arrivalDate: string;

  @Column( 'text', { nullable: false } )
  title: string;

  @Column( 'text', { default: '' } )
  description: string;

  @ManyToOne( () => Property, property => property.package, { eager: true } )
  property: Property;
}