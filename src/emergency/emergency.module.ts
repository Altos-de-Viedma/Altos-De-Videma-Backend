import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmergencyService } from './emergency.service';
import { EmergencyController } from './emergency.controller';
import { AuthModule } from 'src/auth/auth.module';
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
    AuthModule
  ]
} )
export class EmergencyModule { }
