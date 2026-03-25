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

type ErrorType = 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_SERVER_ERROR' | 'FORBIDDEN';

// Función para obtener fecha actual en Buenos Aires
const getBuenosAiresDate = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
};

@Injectable()
export class VisitorService {

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
      date: getBuenosAiresDate() // Usar hora de Buenos Aires
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

  async visitCompleted( id: string, user: User, authHeader?: string ): Promise<Visitor> {

    const visitor = await this.findOne( id );

    if ( !visitor ) {
      this.handleError( 'NOT_FOUND', `Visitor with ID ${ id } not found.` );
    }

    if ( visitor.property.user.id !== user.id && !user.roles.some( role => [ 'admin', 'security' ].includes( role ) ) ) {
      this.handleError( 'FORBIDDEN', 'You are not authorized to mark this visit as completed.' );
    }

    visitor.visitCompleted = true;

    const updatedVisitor = await this.handleDatabaseOperation( () => this.visitorRepository.save( visitor ) );

    // Enviar notificación a N8N después de finalizar la visita
    try {
      await this.sendVisitCompletedNotification(visitor, authHeader);
    } catch (error) {
      console.error('Error sending visit completed notification:', error);
      // No lanzamos el error para no afectar la funcionalidad principal
    }

    return updatedVisitor;
  }

  private async sendVisitCompletedNotification(visitor: Visitor, authHeader?: string): Promise<void> {
    try {
      const n8nUrl = this.configService.get('N8N_URL');
      const evolutionApiUrl = this.configService.get('EVOLUTION_API_URL');
      const instanceName = this.configService.get('INSTANSE_NAME_EVOLUTION_API');

      if (!n8nUrl || !evolutionApiUrl || !instanceName || !visitor.property.user.phone) {
        console.log('Missing configuration or phone number for visit completed notification');
        return;
      }

      // Extraer el token del header Authorization
      const bearerToken = authHeader?.replace('Bearer ', '') || '';

      if (!bearerToken) {
        console.log('No JWT token available for visit completed notification');
        return;
      }

      const message = `👥 *Visita Finalizada* 👥\n\nSeguridad acaba de finalizar la visita registrada:\n\n👤 *Visitante:* ${visitor.fullName}\n📝 *Descripción:* ${visitor.description}\n🏠 *Propiedad:* ${visitor.property.address}\n\n✅ La visita fue finalizada exitosamente.`;

      const payload = {
        phoneNumber: visitor.property.user.phone,
        serverUrl: evolutionApiUrl,
        message: message,
        instanceName: instanceName,
        apikey: "E71D26840311-4506-9DF9-9EED5CFBD114"
      };

      const headers = {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      };

      await firstValueFrom(
        this.httpService.post(`${n8nUrl}/webhook/send-message`, payload, { headers })
      );

      console.log(`Visit completed notification sent for visitor ${visitor.id}`);
    } catch (error) {
      console.error('Failed to send visit completed notification:', error);
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