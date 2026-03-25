import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';

import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
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
  confirmInvoice(@Param('id') id: string, @GetUser() user: User, @Headers('authorization') authHeader: string) {
    return this.invoiceService.confirmInvoice(id, user, authHeader);
  }

  @Delete(':id')
  @Auth()
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.invoiceService.remove(id, user);
  }
}