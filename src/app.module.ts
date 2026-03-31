import { join } from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';

import { ConfigService as SecureConfigService } from './config/config.service';

import { CommonModule } from './common/common.module';
// import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import { MessagesWsModule } from './messages-ws/messages-ws.module';


import { EmergencyModule } from './emergency/emergency.module';
import { PropertyModule } from './property/property.module';
import { NotificationModule } from './notification/notification.module';
import { VisitorModule } from './visitor/visitor.module';
import { PackageModule } from './package/package.module';
import { InvoiceModule } from './invoice/invoice.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secureConfig = new SecureConfigService();
        const dbConfig = secureConfig.databaseConfig;

        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          username: dbConfig.username,
          password: dbConfig.password,
          autoLoadEntities: true,
          // IMPORTANT: Set to false in production after initial migration
          synchronize: configService.get('STAGE') !== 'prod',
          ssl: true, // Always use SSL for Neon
          extra: {
            ssl: {
              rejectUnauthorized: false
            }
          },
          // Connection pool settings for production
          poolSize: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        };
      },
    }),

    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', 'public'),
    //   exclude: ['/api*', '/auth*', '/emergency*', '/package*', '/visitor*', '/property*', '/notification*'],
    // }),


    CommonModule,

    // FilesModule,

    AuthModule,

    MessagesWsModule,

    EmergencyModule,

    PropertyModule,

    NotificationModule,

    VisitorModule,

    PackageModule,

    InvoiceModule,
  ],
})
export class AppModule {}
