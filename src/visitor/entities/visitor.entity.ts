import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Property } from '../../property/entities/property.entity';

@Entity()
export class Visitor {

  @PrimaryGeneratedColumn( 'uuid' )
  id: string;

  @Column( 'boolean', { default: true } )
  status: boolean;

  @Column( 'boolean', { default: false } )
  visitCompleted: boolean;

  @Column( 'timestamp', { nullable: false } )
  date: Date;

  @ManyToOne(
    () => Property,
    property => property.visitor,
    { eager: true }
  )
  property: Property;

  @Column( 'text', { nullable: false } )
  dateAndTimeOfVisit: string;

  @Column( 'text', { nullable: false } )
  fullName: string;

  @Column( 'text', { nullable: true } )
  dni: string;

  @Column( 'text', { nullable: true } )
  phone: string;

  @Column( 'text', { default: '' } )
  description: string;

  @Column( 'text', { default: '', nullable: true } )
  vehiclePlate: string;

  @Column( 'text', { default: 'https://i.imgur.com/O7WbIax.png' } )
  profilePicture: string;
}
