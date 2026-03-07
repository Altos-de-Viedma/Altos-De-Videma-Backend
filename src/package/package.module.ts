import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

import { PackageService } from './package.service';
import { PackageController } from './package.controller';
import { AuthModule } from '../auth/auth.module';
import { Package } from './entities/package.entity';
import { User } from '../auth/entities/user.entity';
import { Property } from '../property/entities/property.entity';

@Module( {
  controllers: [ PackageController ],
  providers: [ PackageService ],
  imports: [
    TypeOrmModule.forFeature( [ Package, User, Property ] ),
    AuthModule
  ]
} )
export class PackageModule { }