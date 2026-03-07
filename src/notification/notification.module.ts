import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { AuthModule } from '../auth/auth.module';
import { Notification } from './entities/notification.entity';

@Module( {
  controllers: [
    NotificationController
  ],
  providers: [
    NotificationService
  ],
  imports: [
    TypeOrmModule.forFeature( [ Notification ] ),
    AuthModule
  ]
} )
export class NotificationModule { }
