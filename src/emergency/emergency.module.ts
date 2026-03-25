import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { EmergencyService } from './emergency.service';
import { EmergencyController } from './emergency.controller';
import { AuthModule } from '../auth/auth.module';
import { Emergency } from './entities/emergency.entity';

@Module( {
  controllers: [
    EmergencyController
  ],
  providers: [
    EmergencyService
  ],
  imports: [
    TypeOrmModule.forFeature( [ Emergency ] ),
    AuthModule,
    HttpModule,
    ConfigModule
  ]
} )
export class EmergencyModule { }
