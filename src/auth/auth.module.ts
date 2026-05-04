import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import type { StringValue } from 'ms';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { Emergency } from '../emergency/entities/emergency.entity';
import { Package } from '../package/entities/package.entity';
import { Visitor } from '../visitor/entities/visitor.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigService as SecureConfigService } from '../config/config.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy ],
  imports: [
    ConfigModule,

    TypeOrmModule.forFeature([ User, Emergency, Package, Visitor ]),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ ConfigModule ],
      inject: [ ConfigService ],
      useFactory: ( configService: ConfigService ): JwtModuleOptions => {
        const secureConfig = new SecureConfigService();
        const jwtConfig = secureConfig.jwtConfig;

        return {
          secret: jwtConfig.secret,
          signOptions: {
            expiresIn: jwtConfig.expiresIn as StringValue
          }
        }
      }
    })
    // JwtModule.register({
      // secret: process.env.JWT_SECRET,
      // signOptions: {
      //   expiresIn:'2h'
      // }
    // })

  ],
  exports: [ TypeOrmModule, JwtStrategy, PassportModule, JwtModule ]
})
export class AuthModule {}
