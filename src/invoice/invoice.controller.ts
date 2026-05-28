import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';

import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { ConfirmInvoiceDto } from './dto/confirm-invoice.dto';
import { BulkCreateInvoiceDto } from './dto/bulk-create-invoice.dto';
import { Auth, GetUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';
import { ValidRoles } from '../auth/interfaces';

@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @Auth()
  create(@Body() createInvoiceDto: CreateInvoiceDto, @GetUser() user: User) {
    return this.invoiceService.create(createInvoiceDto, user);
  }

  @Post('bulk')
  @Auth(ValidRoles.superadmin)
  bulkCreate(@Body() bulkCreateInvoiceDto: BulkCreateInvoiceDto, @GetUser() user: User) {
    return this.invoiceService.bulkCreate(bulkCreateInvoiceDto, user);
  }

  @Post('bulk-test')
  @Auth(ValidRoles.superadmin)
  bulkCreateTest(@Body() bulkCreateInvoiceDto: BulkCreateInvoiceDto) {
    return this.invoiceService.bulkCreate(bulkCreateInvoiceDto, { id: 'test', roles: ['superadmin'] } as any);
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

  @Get('property/:propertyId/paid')
  @Auth()
  findPaidByProperty(@Param('propertyId') propertyId: string) {
    return this.invoiceService.findPaidByProperty(propertyId);
  }

  @Get('deleted')
  @Auth(ValidRoles.superadmin)
  findDeleted() {
    return this.invoiceService.findDeleted();
  }

  @Patch(':id/restore')
  @Auth(ValidRoles.superadmin)
  restore(@Param('id') id: string, @GetUser() user: User) {
    return this.invoiceService.restore(id, user);
  }

  @Get(':id')
  @Auth()
  findOne(@Param('id') id: string) {
    return this.invoiceService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.superadmin)
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto, @GetUser() user: User) {
    return this.invoiceService.update(id, updateInvoiceDto, user);
  }

  @Patch('confirm/:id')
  @Auth()
  confirmInvoice(@Param('id') id: string, @Body() confirmInvoiceDto: ConfirmInvoiceDto, @GetUser() user: User) {
    return this.invoiceService.confirmInvoice(id, confirmInvoiceDto, user);
  }

  @Delete(':id')
  @Auth(ValidRoles.superadmin)
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.invoiceService.remove(id, user);
  }
}