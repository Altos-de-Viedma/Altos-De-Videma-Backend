import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { Property } from './entities/property.entity';
import { User } from '../auth/entities/user.entity';
import { ValidRoles } from '../auth/interfaces';

type ErrorType = 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_SERVER_ERROR' | 'BAD_REQUEST';

@Injectable()
export class PropertyService {

  constructor(
    @InjectRepository( Property )
    private readonly propertyRepository: Repository<Property>
  ) { }

  async create( createPropertyDto: CreatePropertyDto ): Promise<Property> {
    if ( createPropertyDto.isMain ) {
      await this.clearMainProperty( createPropertyDto.user.id );
    }

    const property = this.propertyRepository.create( createPropertyDto );
    const savedProperty = await this.handleDatabaseOperation( () => this.propertyRepository.save( property ) );
    return this.propertyRepository.findOne( {
      where: { id: savedProperty.id },
      relations: [ 'user' ]
    } );
  }

  async findAll(): Promise<Property[]> {
    return this.handleDatabaseOperation( () =>
      this.propertyRepository.find( { where: { status: true }, relations: [ 'user' ] } )
    );
  }

  async findOne( id: string ): Promise<Property> {

    const property = await this.handleDatabaseOperation( () =>
      this.propertyRepository.findOne( {
        where: {
          id,
          status: true
        },
        relations: [ 'user' ]
      } )
    );

    if ( !property ) {
      this.handleError( 'NOT_FOUND', `Propery with ID ${ id } not found.` );
    }

    return property;
  }

  async update( id: string, updatePropertyDto: UpdatePropertyDto ): Promise<Property> {
    const property = await this.findOne( id );

    if ( updatePropertyDto.isMain && !property.isMain ) {
      await this.clearMainProperty( property.user.id );
    }

    const updateProperty = Object.assign( property, updatePropertyDto );
    const savedProperty = await this.handleDatabaseOperation( () => this.propertyRepository.save( updateProperty ) );
    return this.propertyRepository.findOne( {
      where: { id: savedProperty.id },
      relations: [ 'user' ]
    } );
  }

  async remove( id: string ): Promise<Property> {
    const property = await this.findOne( id );
    property.status = false;
    return this.handleDatabaseOperation( () => this.propertyRepository.save( property ) );
  }

  async findByUser( userId: string ): Promise<Property[]> {
    return this.handleDatabaseOperation( () =>
      this.propertyRepository.find( {
        where: { user: { id: userId }, status: true },
        relations: [ 'user' ]
      } )
    );
  }

  async setMainProperty( id: string, user: User ): Promise<Property> {
    const property = await this.findOne( id );

    const isAdmin = user.roles.includes( ValidRoles.admin );
    const isOwner = property.user.id === user.id;

    if ( !isAdmin && !isOwner ) {
      this.handleError( 'BAD_REQUEST', 'No tienes permisos para establecer esta propiedad como principal.' );
    }

    await this.clearMainProperty( property.user.id );
    property.isMain = true;
    return this.handleDatabaseOperation( () => this.propertyRepository.save( property ) );
  }

  private async clearMainProperty( userId: string ): Promise<void> {
    await this.propertyRepository.update(
      { user: { id: userId }, isMain: true },
      { isMain: false }
    );
  }

  private async handleDatabaseOperation<T>( operation: () => Promise<T> ): Promise<T> {
    try {
      return await operation();
    } catch ( error ) {
      if ( error.code === '23505' ) {
        this.handleError( 'CONFLICT', 'A client with this information already exists.' );
      }
      this.handleError( 'INTERNAL_SERVER_ERROR', 'Unable to perform the database operation.' );
    }
  }

  private handleError( type: ErrorType, message: string ): never {
    switch ( type ) {
      case 'NOT_FOUND':
        throw new NotFoundException( message );
      case 'CONFLICT':
        throw new ConflictException( message );
      case 'BAD_REQUEST':
        throw new BadRequestException( message );
      case 'INTERNAL_SERVER_ERROR':
        throw new InternalServerErrorException( message );
      default:
        throw new InternalServerErrorException( 'An unexpected error occurred.' );
    }
  }
}
