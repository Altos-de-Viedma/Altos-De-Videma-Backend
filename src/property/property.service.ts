import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

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
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository( User )
    private readonly userRepository: Repository<User>
  ) { }

  async create( createPropertyDto: CreatePropertyDto ): Promise<Property> {
    // Buscar los usuarios por sus IDs
    const users = await this.userRepository.findBy({ id: In(createPropertyDto.users) });

    if (users.length !== createPropertyDto.users.length) {
      this.handleError('BAD_REQUEST', 'Uno o más usuarios no fueron encontrados.');
    }

    if ( createPropertyDto.isMain ) {
      await this.clearMainPropertyForUsers( createPropertyDto.users );
    }

    const property = this.propertyRepository.create( {
      address: createPropertyDto.address,
      description: createPropertyDto.description,
      isMain: createPropertyDto.isMain || false,
      users: users
    } );

    const savedProperty = await this.handleDatabaseOperation( () => this.propertyRepository.save( property ) );

    // Return the saved property with users relation loaded
    return this.propertyRepository.findOne( {
      where: { id: savedProperty.id },
      relations: [ 'users' ]
    } );
  }

  async findAll(): Promise<Property[]> {
    return this.handleDatabaseOperation( () =>
      this.propertyRepository.find( {
        where: { status: true },
        relations: [ 'users' ]
      } )
    );
  }

  async findOne( id: string ): Promise<Property> {

    const property = await this.handleDatabaseOperation( () =>
      this.propertyRepository.findOne( {
        where: {
          id,
          status: true
        },
        relations: [ 'users' ]
      } )
    );

    if ( !property ) {
      this.handleError( 'NOT_FOUND', `Property with ID ${ id } not found.` );
    }

    return property;
  }

  async update( id: string, updatePropertyDto: UpdatePropertyDto ): Promise<Property> {
    const property = await this.findOne( id );

    if ( updatePropertyDto.isMain && !property.isMain ) {
      const userIds = updatePropertyDto.users || property.users.map(u => u.id);
      await this.clearMainPropertyForUsers( userIds );
    }

    // Si se están actualizando los usuarios
    if (updatePropertyDto.users) {
      const users = await this.userRepository.findBy({ id: In(updatePropertyDto.users) });

      if (users.length !== updatePropertyDto.users.length) {
        this.handleError('BAD_REQUEST', 'Uno o más usuarios no fueron encontrados.');
      }

      property.users = users;
    }

    // Actualizar otros campos
    if (updatePropertyDto.address !== undefined) property.address = updatePropertyDto.address;
    if (updatePropertyDto.description !== undefined) property.description = updatePropertyDto.description;
    if (updatePropertyDto.isMain !== undefined) property.isMain = updatePropertyDto.isMain;

    const savedProperty = await this.handleDatabaseOperation( () => this.propertyRepository.save( property ) );

    // Return the saved property with users relation loaded
    return this.propertyRepository.findOne( {
      where: { id: savedProperty.id },
      relations: [ 'users' ]
    } );
  }

  async remove( id: string ): Promise<Property> {
    const property = await this.findOne( id );
    property.status = false;
    return this.handleDatabaseOperation( () => this.propertyRepository.save( property ) );
  }

  async findByUser( userId: string ): Promise<Property[]> {
    return this.handleDatabaseOperation( () =>
      this.propertyRepository
        .createQueryBuilder('property')
        .leftJoinAndSelect('property.users', 'user')
        .where('property.status = :status', { status: true })
        .andWhere('user.id = :userId', { userId })
        .getMany()
    );
  }

  async setMainProperty( id: string, user: User ): Promise<Property> {
    const property = await this.findOne( id );

    const isAdmin = user.roles.includes( ValidRoles.admin );
    const isOwner = property.users.some(owner => owner.id === user.id);

    if ( !isAdmin && !isOwner ) {
      this.handleError( 'BAD_REQUEST', 'No tienes permisos para establecer esta propiedad como principal.' );
    }

    const userIds = property.users.map(u => u.id);
    await this.clearMainPropertyForUsers( userIds );
    property.isMain = true;
    return this.handleDatabaseOperation( () => this.propertyRepository.save( property ) );
  }

  private async clearMainPropertyForUsers( userIds: string[] ): Promise<void> {
    // Limpiar propiedad principal para todos los usuarios que tienen propiedades con estos usuarios
    await this.propertyRepository
      .createQueryBuilder('property')
      .leftJoin('property.users', 'user')
      .update()
      .set({ isMain: false })
      .where('property.isMain = :isMain', { isMain: true })
      .andWhere('user.id IN (:...userIds)', { userIds })
      .execute();
  }

  private async handleDatabaseOperation<T>( operation: () => Promise<T> ): Promise<T> {
    try {
      return await operation();
    } catch ( error ) {
      if ( error.code === '23505' ) {
        this.handleError( 'CONFLICT', 'A property with this information already exists.' );
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
