import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { Property } from './entities/property.entity';

type ErrorType = 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_SERVER_ERROR';

@Injectable()
export class PropertyService {

  constructor(
    @InjectRepository( Property )
    private readonly propertyRepository: Repository<Property>
  ) { }

  async create( createPropertyDto: CreatePropertyDto ): Promise<Property> {
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
      case 'INTERNAL_SERVER_ERROR':
        throw new InternalServerErrorException( message );
      default:
        throw new InternalServerErrorException( 'An unexpected error occurred.' );
    }
  }
}
