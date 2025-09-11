import { BeforeInsert, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { User } from 'src/auth/entities/user.entity';
import { Visitor } from 'src/visitor/entities/visitor.entity';
import { Package } from 'src/package/entities/package.entity';

@Entity()
export class Property {

  @PrimaryGeneratedColumn( 'uuid' )
  id: string;

  @Column( 'boolean', { default: true } )
  status: boolean;

  @Column( 'timestamp', { nullable: false } )
  date: Date;

  @Column( 'text', { default: '' } )
  address: string;

  @Column( 'text', { default: '' } )
  description: string;

  @ManyToOne(
    () => User,
    user => user.property,
    { eager: true }
  )
  user: User;

  @OneToMany(
    () => Visitor,
    visitor => visitor.property,
    { cascade: true }
  )
  visitor: Visitor;

  @OneToMany(
    () => Package,
    packageData => packageData.property,
    { cascade: true }
  )
  package: Package;

  @BeforeInsert()
  setDate() {
    this.date = new Date();
  }
}
