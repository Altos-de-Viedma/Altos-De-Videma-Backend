import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateEmployeeInsuranceDto, UpdateEmployeeInsuranceDto, ApproveInsuranceDto, RejectInsuranceDto } from './dto';
import { EmployeeInsurance, InsuranceStatus, ApprovalStatus } from './entities/employee-insurance.entity';
import { User } from '../auth/entities/user.entity';
import { ValidRoles } from '../auth/interfaces';

@Injectable()
export class EmployeeInsuranceService {

  constructor(
    @InjectRepository(EmployeeInsurance)
    private readonly insuranceRepository: Repository<EmployeeInsurance>,
  ) {}

  async create(createEmployeeInsuranceDto: CreateEmployeeInsuranceDto, user: User) {
    try {
      const createData: any = {
        ...createEmployeeInsuranceDto,
        expirationDate: new Date(createEmployeeInsuranceDto.expirationDate),
        approvalStatus: ApprovalStatus.PENDING,
        createdBy: user,
      };

      if (createEmployeeInsuranceDto.startDate) {
        createData.startDate = new Date(createEmployeeInsuranceDto.startDate);
      }

      const insurance = this.insuranceRepository.create(createData);

      return await this.insuranceRepository.save(insurance);
    } catch (error) {
      throw new BadRequestException('Error creating employee insurance record');
    }
  }

  async findAll(user: User) {
    const isAdminOrSecurity = user.roles.includes(ValidRoles.admin) || user.roles.includes(ValidRoles.security);

    let whereCondition: any = { isActive: true };

    // If user is not admin or security, only show records they created
    if (!isAdminOrSecurity) {
      whereCondition.createdBy = { id: user.id };
    }

    const insurances = await this.insuranceRepository.find({
      where: whereCondition,
      order: { createdAt: 'DESC' },
      relations: ['createdBy', 'updatedBy', 'approvedBy']
    });

    return insurances;
  }

  async findDeleted(user: User) {
    if (!user.roles.includes(ValidRoles.admin)) {
      throw new ForbiddenException('Solo los administradores pueden ver registros eliminados');
    }

    return await this.insuranceRepository.find({
      where: { isActive: false },
      order: { updatedAt: 'DESC' },
      relations: ['createdBy', 'updatedBy', 'approvedBy']
    });
  }

  async findOne(id: string, user: User) {
    const insurance = await this.insuranceRepository.findOne({
      where: { id, isActive: true },
      relations: ['createdBy', 'updatedBy', 'approvedBy']
    });

    if (!insurance) {
      throw new NotFoundException('Employee insurance record not found');
    }

    // Check if user has permission to view this record
    const isAdminOrSecurity = user.roles.includes(ValidRoles.admin) || user.roles.includes(ValidRoles.security);
    const isOwner = insurance.createdBy.id === user.id;

    if (!isAdminOrSecurity && !isOwner) {
      throw new ForbiddenException('You do not have permission to view this record');
    }

    return insurance;
  }

  async update(id: string, updateEmployeeInsuranceDto: UpdateEmployeeInsuranceDto, user: User) {
    const insurance = await this.findOne(id, user);

    // Check if user has permission to update this record
    const isAdminOrSecurity = user.roles.includes(ValidRoles.admin) || user.roles.includes(ValidRoles.security);
    const isOwner = insurance.createdBy.id === user.id;

    if (!isAdminOrSecurity && !isOwner) {
      throw new ForbiddenException('You do not have permission to update this record');
    }

    try {
      const updateData: any = { ...updateEmployeeInsuranceDto };

      // Convert date strings to Date objects if provided
      if (updateEmployeeInsuranceDto.startDate) {
        updateData.startDate = new Date(updateEmployeeInsuranceDto.startDate);
      }
      if (updateEmployeeInsuranceDto.expirationDate) {
        updateData.expirationDate = new Date(updateEmployeeInsuranceDto.expirationDate);
      }

      updateData.updatedBy = user;

      await this.insuranceRepository.update(id, updateData);
      return await this.findOne(id, user);
    } catch (error) {
      throw new BadRequestException('Error updating employee insurance record');
    }
  }

  async remove(id: string, user: User) {
    // Only admins can delete records
    if (!user.roles.includes(ValidRoles.admin)) {
      throw new ForbiddenException('Only administrators can delete insurance records');
    }

    const insurance = await this.insuranceRepository.findOne({
      where: { id, isActive: true }
    });

    if (!insurance) {
      throw new NotFoundException('Employee insurance record not found');
    }

    // Soft delete - set isActive to false
    await this.insuranceRepository.update(id, {
      isActive: false,
      updatedBy: user
    });

    return { message: 'Employee insurance record deleted successfully' };
  }

  async restore(id: string, user: User) {
    if (!user.roles.includes(ValidRoles.admin)) {
      throw new ForbiddenException('Only administrators can restore insurance records');
    }

    const insurance = await this.insuranceRepository.findOne({
      where: { id, isActive: false }
    });

    if (!insurance) {
      throw new NotFoundException('Deleted employee insurance record not found');
    }

    await this.insuranceRepository.update(id, {
      isActive: true,
      updatedBy: user
    });

    return await this.findOne(id, user);
  }

  async approve(id: string, approveDto: ApproveInsuranceDto, user: User) {
    if (!user.roles.includes(ValidRoles.admin)) {
      throw new ForbiddenException('Solo los administradores pueden aprobar seguros');
    }

    const insurance = await this.insuranceRepository.findOne({
      where: { id, isActive: true },
      relations: ['createdBy']
    });

    if (!insurance) {
      throw new NotFoundException('Registro de seguro no encontrado');
    }

    await this.insuranceRepository.update(id, {
      approvalStatus: ApprovalStatus.APPROVED,
      approvedBy: user,
      approvedAt: new Date(),
      updatedBy: user,
      ...(approveDto.notes ? { notes: approveDto.notes } : {})
    });

    return await this.findOne(id, user);
  }

  async reject(id: string, rejectDto: RejectInsuranceDto, user: User) {
    if (!user.roles.includes(ValidRoles.admin)) {
      throw new ForbiddenException('Solo los administradores pueden rechazar seguros');
    }

    const insurance = await this.insuranceRepository.findOne({
      where: { id, isActive: true },
      relations: ['createdBy']
    });

    if (!insurance) {
      throw new NotFoundException('Registro de seguro no encontrado');
    }

    await this.insuranceRepository.update(id, {
      approvalStatus: ApprovalStatus.REJECTED,
      rejectionReason: rejectDto.rejectionReason,
      approvedBy: user,
      approvedAt: new Date(),
      updatedBy: user
    });

    return await this.findOne(id, user);
  }


  async findExpired(user: User) {
    const isAdminOrSecurity = user.roles.includes(ValidRoles.admin) || user.roles.includes(ValidRoles.security);

    let whereCondition: any = {
      isActive: true,
      status: InsuranceStatus.ACTIVE
    };

    // If user is not admin or security, only show records they created
    if (!isAdminOrSecurity) {
      whereCondition.createdBy = { id: user.id };
    }

    const insurances = await this.insuranceRepository.find({
      where: whereCondition,
      order: { expirationDate: 'ASC' },
      relations: ['createdBy', 'updatedBy']
    });

    // Filter expired insurances
    const currentDate = new Date();
    return insurances.filter(insurance => new Date(insurance.expirationDate) < currentDate);
  }

  async findExpiringSoon(user: User, days: number = 30) {
    const isAdminOrSecurity = user.roles.includes(ValidRoles.admin) || user.roles.includes(ValidRoles.security);

    let whereCondition: any = {
      isActive: true,
      status: InsuranceStatus.ACTIVE
    };

    // If user is not admin or security, only show records they created
    if (!isAdminOrSecurity) {
      whereCondition.createdBy = { id: user.id };
    }

    const insurances = await this.insuranceRepository.find({
      where: whereCondition,
      order: { expirationDate: 'ASC' },
      relations: ['createdBy', 'updatedBy']
    });

    // Filter insurances expiring in the next X days
    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + days);

    return insurances.filter(insurance => {
      const expirationDate = new Date(insurance.expirationDate);
      return expirationDate >= currentDate && expirationDate <= futureDate;
    });
  }

  async getStatistics(user: User) {
    const isAdminOrSecurity = user.roles.includes(ValidRoles.admin) || user.roles.includes(ValidRoles.security);

    let whereCondition: any = { isActive: true };

    // If user is not admin or security, only show records they created
    if (!isAdminOrSecurity) {
      whereCondition.createdBy = { id: user.id };
    }

    const [
      total,
      active,
      expired,
      expiringSoon
    ] = await Promise.all([
      this.insuranceRepository.count({ where: whereCondition }),
      this.insuranceRepository.count({
        where: { ...whereCondition, status: InsuranceStatus.ACTIVE }
      }),
      this.findExpired(user).then(records => records.length),
      this.findExpiringSoon(user, 30).then(records => records.length)
    ]);

    return {
      total,
      active,
      expired,
      expiringSoon,
      inactive: total - active
    };
  }
}
