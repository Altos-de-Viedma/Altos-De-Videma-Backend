import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { DailyCashTransactionsService } from './daily-cash-transactions.service';
import { CreateDailyCashTransactionDto, UpdateDailyCashTransactionDto } from './dto';
import { Auth, GetUser } from '../auth/decorators';
import { ValidRoles } from '../auth/interfaces';
import { User } from '../auth/entities/user.entity';

@ApiTags('Daily Cash Transactions')
@Controller('daily-cash-transactions')
@UseGuards()
export class DailyCashTransactionsController {

  constructor(private readonly dailyCashTransactionsService: DailyCashTransactionsService) {}

  @Post()
  @Auth(ValidRoles.admin)
  @ApiBearerAuth()
  create(
    @Body() createDailyCashTransactionDto: CreateDailyCashTransactionDto,
    @GetUser() user: User
  ) {
    return this.dailyCashTransactionsService.create(createDailyCashTransactionDto, user);
  }

  @Get()
  @Auth(ValidRoles.admin, ValidRoles.user)
  @ApiBearerAuth()
  findAll() {
    return this.dailyCashTransactionsService.findAll();
  }

  @Get('summary')
  @Auth(ValidRoles.admin, ValidRoles.user)
  @ApiBearerAuth()
  getDailySummary() {
    return this.dailyCashTransactionsService.getDailySummary();
  }

  @Get('current-day')
  @Auth(ValidRoles.admin, ValidRoles.user)
  @ApiBearerAuth()
  getCurrentDayTotal() {
    return this.dailyCashTransactionsService.getCurrentDayTotal();
  }

  @Get('total-balance')
  @Auth(ValidRoles.admin, ValidRoles.user)
  @ApiBearerAuth()
  getTotalBalance() {
    return this.dailyCashTransactionsService.getTotalBalance();
  }

  @Get('monthly-balance')
  @Auth(ValidRoles.admin, ValidRoles.user)
  @ApiBearerAuth()
  getMonthlyBalance() {
    return this.dailyCashTransactionsService.getMonthlyBalance();
  }

  @Get('monthly-balances')
  @Auth(ValidRoles.admin, ValidRoles.user)
  @ApiBearerAuth()
  getMonthlyBalances() {
    return this.dailyCashTransactionsService.getMonthlyBalances();
  }

  @Get('by-date')
  @Auth(ValidRoles.admin, ValidRoles.user)
  @ApiBearerAuth()
  findByDate(@Query('date') date: string) {
    return this.dailyCashTransactionsService.findByDate(date);
  }

  @Get(':id')
  @Auth(ValidRoles.admin, ValidRoles.user)
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.dailyCashTransactionsService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.admin)
  @ApiBearerAuth()
  update(
    @Param('id') id: string,
    @Body() updateDailyCashTransactionDto: UpdateDailyCashTransactionDto,
    @GetUser() user: User
  ) {
    return this.dailyCashTransactionsService.update(id, updateDailyCashTransactionDto, user);
  }

  @Delete(':id')
  @Auth(ValidRoles.admin)
  @ApiBearerAuth()
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.dailyCashTransactionsService.remove(id, user);
  }
}
