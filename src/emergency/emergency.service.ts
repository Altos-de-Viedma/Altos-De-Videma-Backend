import { Injectable, NotFoundException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateEmergencyDto } from './dto/create-emergency.dto';
import { UpdateEmergencyDto } from './dto/update-emergency.dto';
import { User } from 'src/auth/entities/user.entity';
import { Emergency } from './entities/emergency.entity';

type ErrorType = 'NOT_FOUND' | 'INTERNAL_SERVER_ERROR' | 'UNAUTHORIZED';

@Injectable()
export class EmergencyService {
  constructor(
    @InjectRepository( Emergency )
    private readonly emergencyRepository: Repository<Emergency>
  ) { }

  async create( createEmergencyDto: CreateEmergencyDto, user: User ): Promise<Emergency> {
    const emergency = this.emergencyRepository.create( {
      ...createEmergencyDto,
      user,
      date: new Date(),
    } );
    return this.handleDatabaseOperation( () => this.emergencyRepository.save( emergency ) );
  }

  async findAll(): Promise<Emergency[]> {
    return this.handleDatabaseOperation( () =>
      this.emergencyRepository.find( { where: { status: true } } )
    );
  }

  async findOne( id: string ): Promise<Emergency> {
    const emergency = await this.handleDatabaseOperation( () =>
      this.emergencyRepository.findOne( {
        where: {
          id,
          status: true
        }
      } )
    );

    if ( !emergency ) {
      this.handleError( 'NOT_FOUND', `Emergency with ID ${ id } not found.` );
    }

    return emergency;
  }

  async update( id: string, updateEmergencyDto: UpdateEmergencyDto ): Promise<Emergency> {
    const emergency = await this.findOne( id );
    const updatedEmergency = Object.assign( emergency, updateEmergencyDto );
    return this.handleDatabaseOperation( () => this.emergencyRepository.save( updatedEmergency ) );
  }

  async emergencyEnded( id: string, user: User ): Promise<Emergency> {
    const emergency = await this.findOne( id );

    if ( !emergency ) {
      this.handleError( 'NOT_FOUND', `Emergency with ID ${ id } not found.` );
    }

    if ( emergency.emergencyEnded || ( emergency.user.id !== user.id && !user.roles.includes( 'admin' ) && !user.roles.includes( 'security' ) ) ) {
      this.handleError( 'UNAUTHORIZED', 'You are not authorized to mark this emergency as ended.' );
    }

    emergency.emergencyEnded = true;
    emergency.seen = true;
    return this.handleDatabaseOperation( () => this.emergencyRepository.save( emergency ) );
  }

  async markAsSeen( id: string, user: User ): Promise<Emergency> {
    const emergency = await this.findOne( id );

    if ( !emergency ) {
      this.handleError( 'NOT_FOUND', `Emergency with ID ${ id } not found.` );
    }

    if ( !user.roles.includes( 'security' ) ) {
      this.handleError( 'UNAUTHORIZED', 'You are not authorized to mark this emergency as seen.' );
    }

    emergency.seen = true;
    return this.handleDatabaseOperation( () => this.emergencyRepository.save( emergency ) );
  }

  async remove( id: string ): Promise<Emergency> {
    const emergency = await this.findOne( id );
    emergency.status = false;
    return this.handleDatabaseOperation( () => this.emergencyRepository.save( emergency ) );
  }

  async findByUser( userId: string ): Promise<Emergency[]> {
    return this.handleDatabaseOperation( () =>
      this.emergencyRepository.find( {
        where: {
          user: { id: userId },
          status: true
        },
        order: {
          date: 'DESC'
        }
      } )
    );
  }

  private async handleDatabaseOperation<T>( operation: () => Promise<T> ): Promise<T> {
    try {
      return await operation();
    } catch ( error ) {
      this.handleError( 'INTERNAL_SERVER_ERROR', 'Unable to perform the database operation.' );
    }
  }

  private handleError( type: ErrorType, message: string ): never {
    switch ( type ) {
      case 'NOT_FOUND':
        throw new NotFoundException( message );
      case 'UNAUTHORIZED':
        throw new UnauthorizedException( message );
      case 'INTERNAL_SERVER_ERROR':
        throw new InternalServerErrorException( message );
      default:
        throw new InternalServerErrorException( 'An unexpected error occurred.' );
    }
  }
}
