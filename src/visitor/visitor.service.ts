import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { CreateVisitorDto } from './dto/create-visitor.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';
import { Visitor } from './entities/visitor.entity';
import { Property } from '../property/entities/property.entity';
import { User } from '../auth/entities/user.entity';
import { ConfigService as SecureConfigService } from '../config/config.service';
import { BuenosAiresDateUtils } from '../common/utils/buenos-aires-date.utils';

type ErrorType = 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_SERVER_ERROR' | 'FORBIDDEN';

@Injectable()
export class VisitorService {
  private readonly secureConfig = new SecureConfigService();

  constructor(
    @InjectRepository( Visitor )
    private readonly visitorRepository: Repository<Visitor>,
    @InjectRepository( Property )
    private readonly propertyRepository: Repository<Property>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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
      date: BuenosAiresDateUtils.now() // Usar hora de Buenos Aires
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
        relations: [ 'property', 'property.users' ]
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

  async visitCompleted( id: string, user: User, authHeader?: string ): Promise<Visitor> {

    const visitor = await this.findOne( id );

    if ( !visitor ) {
      this.handleError( 'NOT_FOUND', `Visitor with ID ${ id } not found.` );
    }

    // Verificar si el usuario es uno de los propietarios de la propiedad
    const isOwner = visitor.property.users.some(owner => owner.id === user.id);
    const isAuthorized = isOwner || user.roles.some( role => [ 'admin', 'security' ].includes( role ) );

    if ( !isAuthorized ) {
      this.handleError( 'FORBIDDEN', 'You are not authorized to mark this visit as completed.' );
    }

    visitor.visitCompleted = true;

    const updatedVisitor = await this.handleDatabaseOperation( () => this.visitorRepository.save( visitor ) );

    // Enviar notificación a N8N después de finalizar la visita
    try {
      await this.sendVisitCompletedNotification(visitor, authHeader);
    } catch (error) {
      // Log error but don't throw to avoid affecting main functionality
      // TODO: Implement proper logging service
    }

    return updatedVisitor;
  }

  private async sendVisitCompletedNotification(visitor: Visitor, authHeader?: string): Promise<void> {
    try {
      const webhookConfig = this.secureConfig.webhookConfig;
      const n8nUrl = webhookConfig.n8nUrl;

      if (!n8nUrl || !visitor.property.users || visitor.property.users.length === 0) {
        // Missing configuration or property owners for visit completed notification
        return;
      }

      // Extraer el token del header Authorization
      const bearerToken = authHeader?.replace('Bearer ', '') || '';

      if (!bearerToken) {
        // No JWT token available for visit completed notification
        return;
      }

      const message = `👥 *Visita Finalizada* 👥

✅ Seguridad acaba de confirmar que finalizó la visita registrada en su propiedad:

👤 *Visitante:* ${visitor.fullName}
📝 *Descripción:* ${visitor.description}
🏠 *Propiedad:* ${visitor.property.address}
📅 *Fecha de ingreso:* ${new Date(visitor.date).toLocaleDateString('es-AR')}
📅 *Fecha de salida:* ${new Date().toLocaleDateString('es-AR')}

🚪 La visita ha sido completada exitosamente. Gracias por utilizar nuestro sistema de registro.`;

      const headers = {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      };

      // Enviar notificación a todos los propietarios
      const notificationPromises = visitor.property.users
        .filter(owner => owner.phone) // Solo a los que tienen teléfono
        .map(owner => {
          const payload = {
            phoneNumber: owner.phone,
            serverUrl: "https://evolution-api.altosdeviedma.com",
            message: message,
            instanceName: "AltosDeViedmaProduccion",
            apikey: "782A3BE06AAC-47C5-AE61-4985CB15631E"
          };

          return firstValueFrom(
            this.httpService.post(`${n8nUrl}/send-message`, payload, { headers })
          );
        });

      await Promise.all(notificationPromises);

      // Visit completed notifications sent successfully
    } catch (error) {
      // Failed to send visit completed notification
      throw error;
    }
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