import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';

import { Auth, GetUser } from '../auth/decorators';
import { CreatePropertyMonthlyPaymentDto } from './dto/create-property-monthly-payment.dto';
import { UpdatePropertyMonthlyPaymentDto } from './dto/update-property-monthly-payment.dto';
import { PropertyMonthlyPaymentsService } from './property-monthly-payments.service';
import { ValidRoles } from '../auth/interfaces';
import { User } from '../auth/entities/user.entity';

@Controller('property-monthly-payments')
export class PropertyMonthlyPaymentsController {
  constructor(
    private readonly propertyMonthlyPaymentsService: PropertyMonthlyPaymentsService
  ) {}

  @Post()
  @Auth(ValidRoles.admin)
  create(@Body() createDto: CreatePropertyMonthlyPaymentDto) {
    return this.propertyMonthlyPaymentsService.create(createDto);
  }

  @Get()
  @Auth()
  findAll() {
    return this.propertyMonthlyPaymentsService.findAll();
  }

  @Get('month/:year/:month')
  @Auth()
  findByMonth(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number
  ) {
    return this.propertyMonthlyPaymentsService.findByMonth(year, month);
  }

  @Get('property/:propertyId')
  @Auth()
  findByProperty(@Param('propertyId') propertyId: string) {
    return this.propertyMonthlyPaymentsService.findByProperty(propertyId);
  }

  @Get('summary/:year/:month')
  @Auth()
  getMonthlyPaymentSummary(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number
  ) {
    return this.propertyMonthlyPaymentsService.getMonthlyPaymentSummary(year, month);
  }

  @Get('property-status/:propertyId')
  @Auth()
  getPropertyPaymentStatus(@Param('propertyId') propertyId: string) {
    return this.propertyMonthlyPaymentsService.getPropertyPaymentStatus(propertyId);
  }

  @Post('initialize/:year/:month')
  @Auth(ValidRoles.admin)
  initializeMonthlyPayments(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Query('defaultAmount') defaultAmount?: number
  ) {
    return this.propertyMonthlyPaymentsService.initializeMonthlyPayments(
      year,
      month,
      defaultAmount || 0
    );
  }

  @Get(':id')
  @Auth()
  findOne(@Param('id') id: string) {
    return this.propertyMonthlyPaymentsService.findByProperty(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.admin)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePropertyMonthlyPaymentDto
  ) {
    return this.propertyMonthlyPaymentsService.update(id, updateDto);
  }

  @Delete(':id')
  @Auth(ValidRoles.admin)
  remove(@Param('id') id: string) {
    return this.propertyMonthlyPaymentsService.remove(id);
  }
}