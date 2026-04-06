import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateDailyCashTransactionDto, UpdateDailyCashTransactionDto } from './dto';
import { DailyCashTransaction, TransactionType } from './entities/daily-cash-transaction.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class DailyCashTransactionsService {

  constructor(
    @InjectRepository(DailyCashTransaction)
    private readonly transactionRepository: Repository<DailyCashTransaction>,
  ) {}

  private getArgentinaDate(): Date {
    const now = new Date();
    // Argentina is UTC-3
    const argentinaOffset = -3 * 60; // minutes
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const argentinaTime = new Date(utc + (argentinaOffset * 60000));

    // Return start of day in Argentina
    return new Date(argentinaTime.getFullYear(), argentinaTime.getMonth(), argentinaTime.getDate());
  }

  private isToday(date: Date): boolean {
    const today = this.getArgentinaDate();
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return today.getTime() === checkDate.getTime();
  }

  async create(createDailyCashTransactionDto: CreateDailyCashTransactionDto, user: User) {
    const today = this.getArgentinaDate();

    const transaction = this.transactionRepository.create({
      ...createDailyCashTransactionDto,
      transactionDate: today,
      createdBy: user,
    });

    return await this.transactionRepository.save(transaction);
  }

  async findAll() {
    const transactions = await this.transactionRepository.find({
      where: { isActive: true },
      order: { transactionDate: 'DESC', createdAt: 'DESC' },
      relations: ['createdBy']
    });

    return this.groupTransactionsByDate(transactions);
  }

  async findByDate(date: string) {
    // Parse the date string and create start of day in Argentina timezone
    const parsedDate = new Date(date);
    const targetDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());

    const transactions = await this.transactionRepository.find({
      where: {
        transactionDate: targetDate,
        isActive: true
      },
      order: { createdAt: 'DESC' },
      relations: ['createdBy']
    });

    return transactions;
  }

  async getDailySummary() {
    const transactions = await this.transactionRepository.find({
      where: { isActive: true },
      order: { transactionDate: 'ASC' }
    });

    const dailySummaries = this.groupTransactionsByDate(transactions);
    let cumulativeTotal = 0;

    return dailySummaries.map((day: any) => {
      const dayTotal = day.entries - day.exits;
      cumulativeTotal += dayTotal;

      return {
        ...day,
        dayTotal,
        cumulativeTotal
      };
    });
  }

  async getCurrentDayTotal() {
    const today = this.getArgentinaDate();

    const transactions = await this.transactionRepository.find({
      where: {
        transactionDate: today,
        isActive: true
      }
    });

    const entries = transactions
      .filter(t => t.type === TransactionType.ENTRY)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const exits = transactions
      .filter(t => t.type === TransactionType.EXIT)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      date: today,
      entries,
      exits,
      dayTotal: entries - exits,
      transactionCount: transactions.length
    };
  }

  async getTotalBalance() {
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(CASE WHEN transaction.type = :entry THEN transaction.amount ELSE -transaction.amount END)', 'balance')
      .where('transaction.isActive = :isActive', { isActive: true })
      .setParameter('entry', TransactionType.ENTRY)
      .getRawOne();

    return Number(result.balance) || 0;
  }

  async getMonthlyBalance() {
    const today = this.getArgentinaDate();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(CASE WHEN transaction.type = :entry THEN transaction.amount ELSE -transaction.amount END)', 'balance')
      .where('transaction.isActive = :isActive', { isActive: true })
      .andWhere('transaction.transactionDate >= :startOfMonth', { startOfMonth })
      .andWhere('transaction.transactionDate <= :endOfMonth', { endOfMonth })
      .setParameter('entry', TransactionType.ENTRY)
      .getRawOne();

    return {
      balance: Number(result.balance) || 0,
      month: today.getMonth() + 1,
      year: today.getFullYear()
    };
  }

  async getMonthlyBalances() {
    const transactions = await this.transactionRepository.find({
      where: { isActive: true },
      order: { transactionDate: 'ASC' }
    });

    if (transactions.length === 0) {
      return [];
    }

    // Group transactions by month/year
    const monthlyGroups = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.transactionDate);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

      if (!acc[monthKey]) {
        acc[monthKey] = {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          transactions: []
        };
      }

      acc[monthKey].transactions.push(transaction);
      return acc;
    }, {} as Record<string, { year: number; month: number; transactions: any[] }>);

    // Calculate balance for each month
    const monthlyBalances = Object.values(monthlyGroups).map(group => {
      const balance = group.transactions.reduce((sum, transaction) => {
        return transaction.type === TransactionType.ENTRY
          ? sum + Number(transaction.amount)
          : sum - Number(transaction.amount);
      }, 0);

      return {
        year: group.year,
        month: group.month,
        balance,
        transactionCount: group.transactions.length
      };
    });

    // Sort by year and month (most recent first)
    return monthlyBalances.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }

  async findOne(id: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { id, isActive: true },
      relations: ['createdBy']
    });

    if (!transaction) {
      throw new NotFoundException('Transacción no encontrada');
    }

    return transaction;
  }

  async update(id: string, updateDailyCashTransactionDto: UpdateDailyCashTransactionDto, user: User) {
    const transaction = await this.findOne(id);

    // Solo se puede editar transacciones del día actual
    if (!this.isToday(transaction.transactionDate)) {
      throw new ForbiddenException('Solo se pueden editar transacciones del día actual');
    }

    Object.assign(transaction, updateDailyCashTransactionDto);
    return await this.transactionRepository.save(transaction);
  }

  async remove(id: string, user: User) {
    const transaction = await this.findOne(id);

    // Solo se puede eliminar transacciones del día actual
    if (!this.isToday(transaction.transactionDate)) {
      throw new ForbiddenException('Solo se pueden eliminar transacciones del día actual');
    }

    transaction.isActive = false;
    return await this.transactionRepository.save(transaction);
  }

  private groupTransactionsByDate(transactions: DailyCashTransaction[]) {
    const grouped = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.transactionDate);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format

      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: transaction.transactionDate,
          transactions: [],
          entries: 0,
          exits: 0
        };
      }

      acc[dateKey].transactions.push(transaction);

      if (transaction.type === TransactionType.ENTRY) {
        acc[dateKey].entries += Number(transaction.amount);
      } else {
        acc[dateKey].exits += Number(transaction.amount);
      }

      return acc;
    }, {} as Record<string, {
      date: Date;
      transactions: DailyCashTransaction[];
      entries: number;
      exits: number;
    }>);

    return Object.values(grouped).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
}
