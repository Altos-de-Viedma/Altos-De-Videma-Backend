import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';

import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { ConfirmInvoiceDto } from './dto/confirm-invoice.dto';
import { BulkCreateInvoiceDto } from './dto/bulk-create-invoice.dto';
import { Auth, GetUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';

@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @Auth()
  create(@Body() createInvoiceDto: CreateInvoiceDto, @GetUser() user: User) {
    return this.invoiceService.create(createInvoiceDto, user);
  }

  @Post('bulk')
  @Auth()
  bulkCreate(@Body() bulkCreateInvoiceDto: BulkCreateInvoiceDto, @GetUser() user: User) {
    return this.invoiceService.bulkCreate(bulkCreateInvoiceDto, user);
  }

  @Get()
  @Auth()
  findAll() {
    return this.invoiceService.findAll();
  }

  @Get('user/invoices')
  @Auth()
  findByUser(@GetUser() user: User) {
    return this.invoiceService.findByUser(user.id);
  }

  @Get(':id')
  @Auth()
  findOne(@Param('id') id: string) {
    return this.invoiceService.findOne(id);
  }

  @Patch(':id')
  @Auth()
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto, @GetUser() user: User) {
    return this.invoiceService.update(id, updateInvoiceDto, user);
  }

  @Patch('confirm/:id')
  @Auth()
  confirmInvoice(@Param('id') id: string, @Body() confirmInvoiceDto: ConfirmInvoiceDto, @GetUser() user: User) {
    return this.invoiceService.confirmInvoice(id, confirmInvoiceDto, user);
  }

  @Delete(':id')
  @Auth()
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.invoiceService.remove(id, user);
  }
}