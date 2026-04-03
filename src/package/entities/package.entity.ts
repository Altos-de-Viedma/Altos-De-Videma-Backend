import { BeforeInsert, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from '../../auth/entities/user.entity';
import { Property } from '../../property/entities/property.entity';

// Función para obtener fecha actual en Buenos Aires
const getBuenosAiresDate = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
};

@Entity()
export class Package {
  @PrimaryGeneratedColumn( 'uuid' )
  id: string;

  @Column( 'boolean', { default: true } )
  status: boolean;

  @Column( 'boolean', { default: false } )
  received: boolean;

  @Column( 'timestamp', { nullable: false } )
  date: Date;

  @ManyToOne( () => User, user => user.notification, { eager: true } )
  user: User;

  @Column( 'text', { default: '' } )
  arrivalDate: string;

  @Column( 'text', { nullable: false } )
  title: string;

  @Column( 'text', { default: '' } )
  description: string;

  @ManyToOne( () => Property, property => property.packages, { eager: true } )
  property: Property;

  @BeforeInsert()
  setCreationDate() {
    // Establecer fecha en hora de Buenos Aires
    if (!this.date) {
      this.date = getBuenosAiresDate();
    }
  }
}