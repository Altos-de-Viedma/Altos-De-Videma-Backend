import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { Package } from './entities/package.entity';
import { User } from 'src/auth/entities/user.entity';
import { Property } from 'src/property/entities/property.entity';

@Injectable()
export class PackageService {
  constructor(
    @InjectRepository( Package )
    private packageRepository: Repository<Package>,
    @InjectRepository( Property )
    private propertyRepository: Repository<Property>,
  ) { }

  async create( createPackageDto: CreatePackageDto, user: User ) {
    const { propertyId, ...packageData } = createPackageDto;

    if ( !user ) {
      throw new NotFoundException( `User not found` );
    }

    const property = await this.propertyRepository.findOne( { where: { id: propertyId } } );
    if ( !property ) {
      throw new NotFoundException( `Property with ID "${ propertyId }" not found` );
    }

    const newPackage = this.packageRepository.create( {
      ...packageData,
      user,
      property,
    } );

    return await this.packageRepository.save( newPackage );
  }


  async findAll() {
    return await this.packageRepository.find();
  }

  async findOne( id: string ) {
    const packageFound = await this.packageRepository.findOne( { where: { id } } );
    if ( !packageFound ) {
      throw new NotFoundException( `Package with ID "${ id }" not found` );
    }
    return packageFound;
  }

  async update( id: string, updatePackageDto: UpdatePackageDto ) {
    const packageToUpdate = await this.findOne( id );
    this.packageRepository.merge( packageToUpdate, updatePackageDto );
    return await this.packageRepository.save( packageToUpdate );
  }


  async markAsReceived( id: string, user: User ) {
    const packageToUpdate = await this.findOne( id );

    if ( !user.roles.includes( 'admin' ) && !user.roles.includes( 'security' ) && packageToUpdate.user.id !== user.id ) {
      throw new ForbiddenException( 'You do not have permission to mark this package as received' );
    }

    packageToUpdate.received = true;
    return await this.packageRepository.save( packageToUpdate );
  }

  async remove( id: string ) {
    const packageToRemove = await this.findOne( id );
    return await this.packageRepository.remove( packageToRemove );
  }

  async findAllByUser( userId: string ) {
    return await this.packageRepository.find( {
      where: { user: { id: userId } },
      relations: [ 'property' ],
    } );
  }
}