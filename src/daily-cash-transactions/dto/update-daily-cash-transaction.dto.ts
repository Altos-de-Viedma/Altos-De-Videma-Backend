import { PartialType } from '@nestjs/swagger';
import { CreateDailyCashTransactionDto } from './create-daily-cash-transaction.dto';

export class UpdateDailyCashTransactionDto extends PartialType(CreateDailyCashTransactionDto) {}
