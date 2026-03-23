import { BeforeInsert, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from '../../auth/entities/user.entity';

// Función para obtener fecha actual en Buenos Aires
const getBuenosAiresDate = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
};

@Entity()
export class Notification {

  @PrimaryGeneratedColumn( 'uuid' )
  id: string;

  @Column( 'boolean', { default: true } )
  status: boolean;

  @Column( 'timestamp', { nullable: false } )
  date: Date;

  @Column( 'boolean', { default: false } )
  seen: boolean;

  @Column( 'text', { nullable: false } )
  title: string;

  @Column( 'text', { nullable: false } )
  description: string;

  @Column( 'text', { nullable: false } )
  link: string;

  @ManyToOne( () => User, user => user.notification, { eager: true } )
  user: User;

  @BeforeInsert()
  setCreationDate() {
    // Establecer fecha en hora de Buenos Aires
    if (!this.date) {
      this.date = getBuenosAiresDate();
    }
  }
}