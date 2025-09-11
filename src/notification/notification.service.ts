import { Injectable, NotFoundException, InternalServerErrorException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification } from './entities/notification.entity';
import { User } from 'src/auth/entities/user.entity';

type ErrorType = 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_SERVER_ERROR' | 'FORBIDDEN';

@Injectable()
export class NotificationService {

  constructor(
    @InjectRepository( Notification )
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository( User )
    private readonly userRepository: Repository<User>
  ) { }

  async create( createNotificationDto: CreateNotificationDto ): Promise<Notification> {
    const user = await this.userRepository.findOne( { where: { id: createNotificationDto.user } } );
    if ( !user ) {
      this.handleError( 'NOT_FOUND', `User with ID ${ createNotificationDto.user } not found.` );
    }

    const notification = this.notificationRepository.create( {
      ...createNotificationDto,
      date: new Date(),
      user
    } );
    return this.handleDatabaseOperation( () => this.notificationRepository.save( notification ) );
  }

  async findAll(): Promise<Notification[]> {
    return this.handleDatabaseOperation( () =>
      this.notificationRepository.find( { where: { status: true } } )
    );
  }

  async findOne( id: string ): Promise<Notification> {
    const notification = await this.handleDatabaseOperation( () =>
      this.notificationRepository.findOne( {
        where: {
          id,
          status: true
        }
      } )
    );
    if ( !notification ) {
      this.handleError( 'NOT_FOUND', `Notification with ID ${ id } not found.` );
    }
    return notification;
  }

  async findAllByUser( userId: string ): Promise<Notification[]> {
    const user = await this.userRepository.findOne( { where: { id: userId } } );
    if ( !user ) {
      this.handleError( 'NOT_FOUND', `User with ID ${ userId } not found.` );
    }

    return this.handleDatabaseOperation( () =>
      this.notificationRepository.find( {
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


  async update( id: string, updateNotificationDto: UpdateNotificationDto ): Promise<Notification> {
    const notification = await this.findOne( id );
    const updatedNotification = Object.assign( notification, updateNotificationDto );
    return this.handleDatabaseOperation( () => this.notificationRepository.save( updatedNotification ) );
  }

  async remove( id: string ): Promise<Notification> {
    const notification = await this.findOne( id );
    notification.status = false;
    return this.handleDatabaseOperation( () => this.notificationRepository.save( notification ) );
  }

  async findByUser( userId: string ): Promise<Notification[]> {
    return this.handleDatabaseOperation( () =>
      this.notificationRepository.find( {
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

  async markAsSeen( id: string, userId: string, isAdmin: boolean ): Promise<Notification> {
    const notification = await this.findOne( id );

    if ( notification.user.id !== userId && !isAdmin ) {
      this.handleError( 'FORBIDDEN', 'You do not have permission to mark this notification as seen.' );
    }

    notification.seen = true;
    return this.handleDatabaseOperation( () => this.notificationRepository.save( notification ) );
  }
  private async handleDatabaseOperation<T>( operation: () => Promise<T> ): Promise<T> {
    try {
      return await operation();
    } catch ( error ) {
      console.error( 'Database operation error:', error );
      if ( error.code === '23505' ) {
        this.handleError( 'CONFLICT', 'A notification with this information already exists.' );
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