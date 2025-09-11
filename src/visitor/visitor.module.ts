import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VisitorService } from './visitor.service';
import { VisitorController } from './visitor.controller';
import { AuthModule } from 'src/auth/auth.module';
import { Visitor } from './entities/visitor.entity';
import { Property } from 'src/property/entities/property.entity';

@Module( {
  controllers: [
    VisitorController
  ],
  providers: [
    VisitorService
  ],
  imports: [
    TypeOrmModule.forFeature( [ Visitor, Property ] ),
    AuthModule
  ]
} )
export class VisitorModule { }
