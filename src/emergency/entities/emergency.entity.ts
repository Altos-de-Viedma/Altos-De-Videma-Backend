import { User } from '../../auth/entities/user.entity';
import { BeforeInsert, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

// Función para obtener fecha actual en Buenos Aires
const getBuenosAiresDate = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
};

@Entity()
export class Emergency {

  @PrimaryGeneratedColumn( 'uuid' )
  id: string;

  @Column( 'boolean', { default: true } )
  status: boolean;

  @Column( 'timestamp', { nullable: false } )
  date: Date;

  @Column( 'boolean', { default: false } )
  seen: boolean;

  @Column( 'boolean', { default: false } )
  emergencyEnded: boolean;

  @Column( 'text', { nullable: false } )
  title: string;

  @Column( 'text', { nullable: false } )
  description: string;

  @ManyToOne(
    () => User,
    user => user.emergency,
    { eager: true }
  )
  user: User;

  @BeforeInsert()
  setCreationDate() {
    // Establecer fecha en hora de Buenos Aires
    if (!this.date) {
      this.date = getBuenosAiresDate();
    }
  }
}
