import { BeforeInsert, Column, Entity, ManyToMany, JoinTable, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { User } from '../../auth/entities/user.entity';
import { Visitor } from '../../visitor/entities/visitor.entity';
import { Package } from '../../package/entities/package.entity';
import { BuenosAiresDateUtils } from '../../common/utils/buenos-aires-date.utils';

@Entity()
export class Property {

  @PrimaryGeneratedColumn( 'uuid' )
  id: string;

  @Column( 'boolean', { default: true } )
  status: boolean;

  @Column( 'boolean', { default: false } )
  isMain: boolean;

  @Column( 'timestamp', { nullable: false } )
  date: Date;

  @Column( 'text', { default: '' } )
  address: string;

  @Column( 'text', { default: '' } )
  description: string;

  @ManyToMany(
    () => User,
    user => user.properties
  )
  @JoinTable({
    name: 'property_users',
    joinColumn: { name: 'property_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' }
  })
  users: User[];

  @OneToMany(
    () => Visitor,
    visitor => visitor.property,
    { cascade: true }
  )
  visitors: Visitor[];

  @OneToMany(
    () => Package,
    packageData => packageData.property,
    { cascade: true }
  )
  packages: Package[];

  @BeforeInsert()
  setDate() {
    // Establecer fecha en hora de Buenos Aires
    this.date = BuenosAiresDateUtils.now();
  }
}
