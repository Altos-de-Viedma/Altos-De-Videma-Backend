import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DateTime } from 'luxon';

import { CreateDailyCashTransactionDto, UpdateDailyCashTransactionDto } from './dto';
import { DailyCashTransaction, TransactionType } from './entities/daily-cash-transaction.entity';
import { User } from '../auth/entities/user.entity';
import { Property } from '../property/entities/property.entity';

@Injectable()
export class DailyCashTransactionsService {

  constructor(
    @InjectRepository(DailyCashTransaction)
    private readonly transactionRepository: Repository<DailyCashTransaction>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
  ) {}

  private getArgentinaDate(): Date {
    // Usar Luxon para obtener los componentes de fecha en Buenos Aires
    const nowBA = DateTime.now().setZone('America/Argentina/Buenos_Aires');
    // Crear fecha usando los componentes de Buenos Aires como string ISO para evitar problemas de timezone
    // PostgreSQL date column stores just YYYY-MM-DD, so we create a date that represents that
    const dateStr = `${nowBA.year}-${String(nowBA.month).padStart(2, '0')}-${String(nowBA.day).padStart(2, '0')}`;
    return new Date(dateStr + 'T00:00:00');
  }

  private getArgentinaDateString(): string {
    const nowBA = DateTime.now().setZone('America/Argentina/Buenos_Aires');
    return `${nowBA.year}-${String(nowBA.month).padStart(2, '0')}-${String(nowBA.day).padStart(2, '0')}`;
  }

  private isToday(date: Date | string): boolean {
    const todayStr = DateTime.now().setZone('America/Argentina/Buenos_Aires').toISODate();
    // When date is a string like "2026-05-27", extract just the date part
    const dateStr = typeof date === 'string' 
      ? date.substring(0, 10) 
      : DateTime.fromJSDate(date).setZone('America/Argentina/Buenos_Aires').toISODate();
    return todayStr === dateStr;
  }

  /**
   * Safely extracts year and month from a transactionDate value,
   * handling both Date objects and strings from PostgreSQL date column.
   * Avoids timezone-related month shifting by parsing as local date components.
   */
  private extractYearMonth(transactionDate: Date | string): { year: number; month: number } {
    // If it's a string like "2026-06-01" or "2026-06-01T00:00:00.000Z", parse the date part directly
    const dateStr = typeof transactionDate === 'string'
      ? transactionDate
      : transactionDate.toISOString();
    
    // Extract YYYY-MM-DD from the string to avoid timezone issues
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return { year: parseInt(match[1], 10), month: parseInt(match[2], 10) };
    }

    // Fallback: use Luxon for safe parsing
    const dt = typeof transactionDate === 'string'
      ? DateTime.fromISO(transactionDate)
      : DateTime.fromJSDate(transactionDate);
    return { year: dt.year, month: dt.month };
  }

  /**
   * Safely extracts the date string (YYYY-MM-DD) from a transactionDate value.
   */
  private extractDateKey(transactionDate: Date | string): string {
    const dateStr = typeof transactionDate === 'string'
      ? transactionDate
      : transactionDate.toISOString();
    
    const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : dateStr.substring(0, 10);
  }

  async create(createDailyCashTransactionDto: CreateDailyCashTransactionDto, user: User) {
    const { propertyIds, transactionDate, ...transactionData } = createDailyCashTransactionDto;
    
    // Parse the date if provided, otherwise use current date in Argentina timezone
    let dateToUse = this.getArgentinaDate();
    if (transactionDate) {
      // Parse as local date components to avoid timezone shifting
      const transactionDateStr = typeof transactionDate === 'string'
        ? transactionDate
        : transactionDate.toISOString();
      const match = transactionDateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        dateToUse = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00`);
      } else {
        const parsed = new Date(transactionDate);
        if (!isNaN(parsed.getTime())) {
          dateToUse = parsed;
        }
      }
    }

    // Si se proporcionan IDs de propiedades, buscarlas
    let properties: Property[] = [];
    if (propertyIds && propertyIds.length > 0) {
      properties = await this.propertyRepository.findByIds(propertyIds);

      if (properties.length !== propertyIds.length) {
        throw new BadRequestException('Una o más propiedades no fueron encontradas');
      }
    }

    const transaction = this.transactionRepository.create({
      ...transactionData,
      transactionDate: dateToUse,
      createdBy: user,
      properties,
    });

    return await this.transactionRepository.save(transaction);
  }

  async findAll() {
    const transactions = await this.transactionRepository.find({
      where: { isActive: true },
      order: { transactionDate: 'DESC', createdAt: 'DESC' },
      relations: ['createdBy', 'properties']
    });

    return this.groupTransactionsByDate(transactions);
  }

  async findByDate(date: string) {
    // Use raw query to compare date column directly, avoiding timezone issues
    const transactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.createdBy', 'createdBy')
      .leftJoinAndSelect('transaction.properties', 'properties')
      .where('transaction.isActive = :isActive', { isActive: true })
      .andWhere('transaction.transactionDate = :targetDate', { targetDate: date.substring(0, 10) })
      .orderBy('transaction.createdAt', 'DESC')
      .getMany();

    return transactions;
  }

  async findDeleted() {
    const transactions = await this.transactionRepository.find({
      where: { isActive: false },
      order: { transactionDate: 'DESC', createdAt: 'DESC' },
      relations: ['createdBy', 'properties']
    });

    return transactions; // Not grouping by date to keep it simple for a list view
  }

  async restore(id: string, user: User) {
    const transaction = await this.transactionRepository.findOne({
      where: { id, isActive: false },
      relations: ['createdBy', 'properties']
    });

    if (!transaction) {
      throw new NotFoundException('Transacción borrada no encontrada');
    }

    if (!user.roles.includes('admin')) {
      throw new ForbiddenException('Solo los administradores pueden restaurar transacciones');
    }

    transaction.isActive = true;
    return await this.transactionRepository.save(transaction);
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
    // Use date string comparison to avoid timezone issues with Date objects
    const todayStr = this.getArgentinaDateString();

    const transactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.isActive = :isActive', { isActive: true })
      .andWhere('transaction.transactionDate = :today', { today: todayStr })
      .getMany();

    const entries = transactions
      .filter(t => t.type === TransactionType.ENTRY)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const exits = transactions
      .filter(t => t.type === TransactionType.EXIT)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      date: todayStr,
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
    // Use EXTRACT to get month/year directly from the date column, avoiding timezone issues
    const nowBA = DateTime.now().setZone('America/Argentina/Buenos_Aires');
    const currentMonth = nowBA.month;
    const currentYear = nowBA.year;

    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(CASE WHEN transaction.type = :entry THEN transaction.amount ELSE -transaction.amount END)', 'balance')
      .where('transaction.isActive = :isActive', { isActive: true })
      .andWhere('EXTRACT(MONTH FROM transaction."transactionDate") = :month', { month: currentMonth })
      .andWhere('EXTRACT(YEAR FROM transaction."transactionDate") = :year', { year: currentYear })
      .setParameter('entry', TransactionType.ENTRY)
      .getRawOne();

    return {
      balance: Number(result.balance) || 0,
      month: currentMonth,
      year: currentYear
    };
  }

  async getMonthlyBalances() {
    // Use SQL GROUP BY with EXTRACT to avoid any timezone issues with JavaScript Date parsing.
    // transactionDate is a PostgreSQL 'date' column, so EXTRACT works directly on the stored date values.
    const results = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('EXTRACT(YEAR FROM transaction."transactionDate")', 'year')
      .addSelect('EXTRACT(MONTH FROM transaction."transactionDate")', 'month')
      .addSelect(
        'SUM(CASE WHEN transaction.type = :entry THEN transaction.amount ELSE -transaction.amount END)',
        'balance'
      )
      .addSelect('COUNT(*)', 'transactionCount')
      .where('transaction.isActive = :isActive', { isActive: true })
      .setParameter('entry', TransactionType.ENTRY)
      .groupBy('EXTRACT(YEAR FROM transaction."transactionDate")')
      .addGroupBy('EXTRACT(MONTH FROM transaction."transactionDate")')
      .orderBy('EXTRACT(YEAR FROM transaction."transactionDate")', 'DESC')
      .addOrderBy('EXTRACT(MONTH FROM transaction."transactionDate")', 'DESC')
      .getRawMany();

    return results.map(row => ({
      year: Number(row.year),
      month: Number(row.month),
      balance: Number(row.balance) || 0,
      transactionCount: Number(row.transactionCount) || 0
    }));
  }

  async getMonthlyTransactions(month: number, year: number) {
    // Validate input
    if (!month || !year || month < 1 || month > 12) {
      throw new BadRequestException('Invalid month or year provided');
    }

    // Use EXTRACT to compare directly on the date column, avoiding timezone issues
    const transactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.createdBy', 'createdBy')
      .leftJoinAndSelect('transaction.properties', 'properties')
      .where('transaction.isActive = :isActive', { isActive: true })
      .andWhere('EXTRACT(MONTH FROM transaction."transactionDate") = :month', { month })
      .andWhere('EXTRACT(YEAR FROM transaction."transactionDate") = :year', { year })
      .orderBy('transaction.transactionDate', 'DESC')
      .addOrderBy('transaction.createdAt', 'DESC')
      .getMany();

    return transactions;
  }

  async findOne(id: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { id, isActive: true },
      relations: ['createdBy', 'properties']
    });

    if (!transaction) {
      throw new NotFoundException('Transacción no encontrada');
    }

    return transaction;
  }

  async update(id: string, updateDailyCashTransactionDto: UpdateDailyCashTransactionDto, user: User) {
    const transaction = await this.findOne(id);

    // Solo se puede editar transacciones del día actual, a menos que sea admin
    if (!this.isToday(transaction.transactionDate) && !user.roles.includes('admin')) {
      throw new ForbiddenException('Solo los administradores pueden editar transacciones de fechas pasadas');
    }

    Object.assign(transaction, updateDailyCashTransactionDto);
    return await this.transactionRepository.save(transaction);
  }

  async remove(id: string, user: User) {
    const transaction = await this.findOne(id);

    // Solo se puede eliminar transacciones del día actual, a menos que sea admin
    if (!this.isToday(transaction.transactionDate) && !user.roles.includes('admin')) {
      throw new ForbiddenException('Solo los administradores pueden eliminar transacciones de fechas pasadas');
    }

    transaction.isActive = false;
    return await this.transactionRepository.save(transaction);
  }

  private groupTransactionsByDate(transactions: DailyCashTransaction[]) {
    const grouped = transactions.reduce((acc, transaction) => {
      // Use extractDateKey to safely get YYYY-MM-DD without timezone issues
      const dateKey = this.extractDateKey(transaction.transactionDate);

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
