import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from 'src/auth/entities/user.entity';

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
}