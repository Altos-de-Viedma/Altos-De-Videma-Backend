import { join } from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';

import { CommonModule } from './common/common.module';
// import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import { MessagesWsModule } from './messages-ws/messages-ws.module';


import { EmergencyModule } from './emergency/emergency.module';
import { PropertyModule } from './property/property.module';
import { NotificationModule } from './notification/notification.module';
import { VisitorModule } from './visitor/visitor.module';
import { PackageModule } from './package/package.module';


@Module({
  imports: [
    ConfigModule.forRoot(),

    TypeOrmModule.forRoot({
      ssl: process.env.STAGE === 'prod',
      extra: {
        ssl: process.env.STAGE === 'prod'
              ? { rejectUnauthorized: false }
              : null,
      },
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,      
      autoLoadEntities: true,
      synchronize: true,
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname,'..','public'), 
    }),


    CommonModule,

    // FilesModule,

    AuthModule,

    MessagesWsModule,

    EmergencyModule,

    PropertyModule,

    NotificationModule,

    VisitorModule,

    PackageModule,
  ],
})
export class AppModule {}
