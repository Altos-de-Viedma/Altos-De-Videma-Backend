import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DailyCashTransactionsService } from './daily-cash-transactions.service';
import { DailyCashTransactionsController } from './daily-cash-transactions.controller';
import { DailyCashTransaction } from './entities/daily-cash-transaction.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [
    DailyCashTransactionsController
  ],
  providers: [
    DailyCashTransactionsService
  ],
  imports: [
    TypeOrmModule.forFeature([DailyCashTransaction]),
    AuthModule
  ],
  exports: [
    DailyCashTransactionsService,
    TypeOrmModule
  ]
})
export class DailyCashTransactionsModule {}
