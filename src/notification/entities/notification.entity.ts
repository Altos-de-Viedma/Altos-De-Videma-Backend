import { BeforeInsert, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from '../../auth/entities/user.entity';
import { BuenosAiresDateUtils } from '../../common/utils/buenos-aires-date.utils';

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
      this.date = BuenosAiresDateUtils.now();
    }
  }
}