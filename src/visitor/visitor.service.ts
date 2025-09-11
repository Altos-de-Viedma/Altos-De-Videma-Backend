import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateVisitorDto } from './dto/create-visitor.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';
import { Visitor } from './entities/visitor.entity';
import { Property } from 'src/property/entities/property.entity';
import { User } from 'src/auth/entities/user.entity';

type ErrorType = 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_SERVER_ERROR' | 'FORBIDDEN';

@Injectable()
export class VisitorService {

  constructor(
    @InjectRepository( Visitor )
    private readonly visitorRepository: Repository<Visitor>,
    @InjectRepository( Property )
    private readonly propertyRepository: Repository<Property>
  ) { }

  async create( createVisitorDto: CreateVisitorDto ): Promise<Visitor> {
    const property = await this.propertyRepository.findOne( {
      where: { id: createVisitorDto.property, status: true }
    } );

    if ( !property ) {
      this.handleError( 'NOT_FOUND', `Property with ID ${ createVisitorDto.property } not found.` );
    }

    const visitor = this.visitorRepository.create( {
      ...createVisitorDto,
      property,
      date: new Date()
    } );

    return this.handleDatabaseOperation( () => this.visitorRepository.save( visitor ) );
  }

  async findAll(): Promise<Visitor[]> {
    return this.handleDatabaseOperation( () =>
      this.visitorRepository.find( { where: { status: true } } )
    );
  }

  async findOne( id: string ): Promise<Visitor> {
    const visitor = await this.handleDatabaseOperation( () =>
      this.visitorRepository.findOne( {
        where: {
          id,
          status: true
        },
        relations: [ 'property', 'property.user' ]
      } )
    );
    if ( !visitor ) {
      this.handleError( 'NOT_FOUND', `Visitor with ID ${ id } not found.` );
    }
    return visitor;
  }

  async update( id: string, updateVisitorDto: UpdateVisitorDto ): Promise<Visitor> {
    const visitor = await this.findOne( id );
    const updatedVisitor = Object.assign( visitor, updateVisitorDto );
    await this.handleDatabaseOperation( () => this.visitorRepository.save( updatedVisitor ) );
    return this.visitorRepository.findOne( {
      where: { id },
      relations: [ 'property' ]
    } );
  }

  async remove( id: string ): Promise<Visitor> {
    const visitor = await this.findOne( id );
    visitor.status = false;
    return this.handleDatabaseOperation( () => this.visitorRepository.save( visitor ) );
  }

  async visitCompleted( id: string, user: User ): Promise<Visitor> {

    const visitor = await this.findOne( id );

    if ( !visitor ) {
      this.handleError( 'NOT_FOUND', `Visitor with ID ${ id } not found.` );
    }

    if ( visitor.property.user.id !== user.id && !user.roles.some( role => [ 'admin', 'security' ].includes( role ) ) ) {
      this.handleError( 'FORBIDDEN', 'You are not authorized to mark this visit as completed.' );
    }

    visitor.visitCompleted = true;

    return this.handleDatabaseOperation( () => this.visitorRepository.save( visitor ) );
  }

  private async handleDatabaseOperation<T>( operation: () => Promise<T> ): Promise<T> {
    try {
      return await operation();
    } catch ( error ) {
      if ( error.code === '23505' ) {
        this.handleError( 'CONFLICT', 'A visitor with this information already exists.' );
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
      case 'FORBIDDEN':
        throw new ForbiddenException( message );
      default:
        throw new InternalServerErrorException( 'An unexpected error occurred.' );
    }
  }
}