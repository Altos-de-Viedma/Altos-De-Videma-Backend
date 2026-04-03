import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

import { PropertyService } from './property.service';
import { PropertyController } from './property.controller';
import { AuthModule } from '../auth/auth.module';
import { Property } from './entities/property.entity';
import { User } from '../auth/entities/user.entity';

@Module( {
  controllers: [
    PropertyController
  ],
  providers: [
    PropertyService
  ],
  imports: [
    TypeOrmModule.forFeature( [ Property, User ] ),
    AuthModule
  ]
} )
export class PropertyModule { }
