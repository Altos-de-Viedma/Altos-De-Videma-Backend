import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { EmployeeInsuranceService } from './employee-insurance.service';
import { CreateEmployeeInsuranceDto, UpdateEmployeeInsuranceDto } from './dto';
import { Auth, GetUser } from '../auth/decorators';
import { ValidRoles } from '../auth/interfaces';
import { User } from '../auth/entities/user.entity';

@ApiTags('Employee Insurance')
@Controller('employee-insurance')
@UseGuards()
export class EmployeeInsuranceController {

  constructor(private readonly employeeInsuranceService: EmployeeInsuranceService) {}

  @Post()
  @Auth(ValidRoles.admin, ValidRoles.security, ValidRoles.user)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new employee insurance record' })
  @ApiResponse({ status: 201, description: 'Insurance record created successfully' })
  create(
    @Body() createEmployeeInsuranceDto: CreateEmployeeInsuranceDto,
    @GetUser() user: User
  ) {
    return this.employeeInsuranceService.create(createEmployeeInsuranceDto, user);
  }

  @Get()
  @Auth(ValidRoles.admin, ValidRoles.security, ValidRoles.user)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all employee insurance records' })
  @ApiResponse({ status: 200, description: 'List of insurance records retrieved successfully' })
  findAll(@GetUser() user: User) {
    return this.employeeInsuranceService.findAll(user);
  }

  @Get('statistics')
  @Auth(ValidRoles.admin, ValidRoles.security, ValidRoles.user)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get insurance statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStatistics(@GetUser() user: User) {
    return this.employeeInsuranceService.getStatistics(user);
  }

  @Get('expired')
  @Auth(ValidRoles.admin, ValidRoles.security, ValidRoles.user)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get expired insurance records' })
  @ApiResponse({ status: 200, description: 'Expired insurance records retrieved successfully' })
  findExpired(@GetUser() user: User) {
    return this.employeeInsuranceService.findExpired(user);
  }

  @Get('expiring-soon')
  @Auth(ValidRoles.admin, ValidRoles.security, ValidRoles.user)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get insurance records expiring soon' })
  @ApiResponse({ status: 200, description: 'Expiring insurance records retrieved successfully' })
  findExpiringSoon(
    @Query('days') days: string = '30',
    @GetUser() user: User
  ) {
    const daysNumber = parseInt(days, 10) || 30;
    return this.employeeInsuranceService.findExpiringSoon(user, daysNumber);
  }

  @Get(':id')
  @Auth(ValidRoles.admin, ValidRoles.security, ValidRoles.user)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific employee insurance record' })
  @ApiResponse({ status: 200, description: 'Insurance record retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Insurance record not found' })
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.employeeInsuranceService.findOne(id, user);
  }

  @Patch(':id')
  @Auth(ValidRoles.admin, ValidRoles.security, ValidRoles.user)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an employee insurance record' })
  @ApiResponse({ status: 200, description: 'Insurance record updated successfully' })
  @ApiResponse({ status: 404, description: 'Insurance record not found' })
  update(
    @Param('id') id: string,
    @Body() updateEmployeeInsuranceDto: UpdateEmployeeInsuranceDto,
    @GetUser() user: User
  ) {
    return this.employeeInsuranceService.update(id, updateEmployeeInsuranceDto, user);
  }

  @Delete(':id')
  @Auth(ValidRoles.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an employee insurance record (Admin only)' })
  @ApiResponse({ status: 200, description: 'Insurance record deleted successfully' })
  @ApiResponse({ status: 404, description: 'Insurance record not found' })
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.employeeInsuranceService.remove(id, user);
  }
}
