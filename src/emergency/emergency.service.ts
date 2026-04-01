import { Injectable, NotFoundException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { CreateEmergencyDto } from './dto/create-emergency.dto';
import { UpdateEmergencyDto } from './dto/update-emergency.dto';
import { User } from '../auth/entities/user.entity';
import { Emergency } from './entities/emergency.entity';
import { ConfigService as SecureConfigService } from '../config/config.service';

type ErrorType = 'NOT_FOUND' | 'INTERNAL_SERVER_ERROR' | 'UNAUTHORIZED';

// Función para obtener fecha actual en Buenos Aires
const getBuenosAiresDate = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
};

@Injectable()
export class EmergencyService {
  private readonly secureConfig = new SecureConfigService();

  constructor(
    @InjectRepository( Emergency )
    private readonly emergencyRepository: Repository<Emergency>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) { }

  async create( createEmergencyDto: CreateEmergencyDto, user: User ): Promise<Emergency> {
    const emergency = this.emergencyRepository.create( {
      ...createEmergencyDto,
      user,
      date: getBuenosAiresDate(), // Usar hora de Buenos Aires
    } );
    return this.handleDatabaseOperation( () => this.emergencyRepository.save( emergency ) );
  }

  async findAll(): Promise<Emergency[]> {
    return this.handleDatabaseOperation( () =>
      this.emergencyRepository.find( {
        where: {
          status: true
        },
        order: {
          seen: 'ASC',  // No vistas primero (false = 0, true = 1)
          date: 'DESC'  // Más recientes primero dentro de cada grupo
        }
      } )
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

  async emergencyEnded( id: string, user: User, authHeader?: string ): Promise<Emergency> {
    const emergency = await this.findOne( id );

    if ( !emergency ) {
      this.handleError( 'NOT_FOUND', `Emergency with ID ${ id } not found.` );
    }

    if ( emergency.emergencyEnded || ( emergency.user.id !== user.id && !user.roles.includes( 'admin' ) && !user.roles.includes( 'security' ) ) ) {
      this.handleError( 'UNAUTHORIZED', 'You are not authorized to mark this emergency as ended.' );
    }

    emergency.emergencyEnded = true;
    emergency.seen = true;
    const updatedEmergency = await this.handleDatabaseOperation( () => this.emergencyRepository.save( emergency ) );

    // Enviar notificación a N8N después de finalizar la emergencia
    try {
      await this.sendEmergencyEndedNotification(emergency, authHeader);
    } catch (error) {
      console.error('Error sending emergency ended notification:', error);
      // No lanzamos el error para no afectar la funcionalidad principal
    }

    return updatedEmergency;
  }

  async markAsSeen( id: string, user: User, authHeader?: string ): Promise<Emergency> {
    const emergency = await this.findOne( id );

    if ( !emergency ) {
      this.handleError( 'NOT_FOUND', `Emergency with ID ${ id } not found.` );
    }

    if ( !user.roles.includes( 'security' ) ) {
      this.handleError( 'UNAUTHORIZED', 'You are not authorized to mark this emergency as seen.' );
    }

    emergency.seen = true;
    const updatedEmergency = await this.handleDatabaseOperation( () => this.emergencyRepository.save( emergency ) );

    // Enviar notificación a N8N después de marcar como vista
    try {
      await this.sendEmergencySeenNotification(emergency, authHeader);
    } catch (error) {
      console.error('Error sending emergency seen notification:', error);
      // No lanzamos el error para no afectar la funcionalidad principal
    }

    return updatedEmergency;
  }

  private async sendEmergencySeenNotification(emergency: Emergency, authHeader?: string): Promise<void> {
    try {
      const webhookConfig = this.secureConfig.webhookConfig;
      const n8nUrl = webhookConfig.n8nUrl;

      if (!n8nUrl || !emergency.user.phone) {
        console.log('Missing configuration or phone number for emergency notification');
        return;
      }

      // Extraer el token del header Authorization
      const bearerToken = authHeader?.replace('Bearer ', '') || '';

      if (!bearerToken) {
        console.log('No JWT token available for emergency notification');
        return;
      }

      const message = `🚨 *Emergencia Vista por Seguridad* 🚨\\n\\n👀 Seguridad acaba de confirmar que recibió y está atendiendo su emergencia:\\n\\n📋 *Título:* ${emergency.title}\\n📝 *Descripción:* ${emergency.description}\\n📅 *Fecha:* ${new Date(emergency.date).toLocaleDateString('es-AR')}\\n\\n✅ Su emergencia está siendo atendida por el equipo de seguridad. Manténgase tranquilo/a.`;

      const payload = {
        phoneNumber: emergency.user.phone,
        serverUrl: "https://evolution-api.altosdeviedma.com",
        message: message,
        instanceName: "AltosDeViedmaProduccion",
        apikey: "782A3BE06AAC-47C5-AE61-4985CB15631E"
      };

      const headers = {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      };

      await firstValueFrom(
        this.httpService.post(`${n8nUrl}/webhook/send-message`, payload, { headers })
      );

      console.log(`Emergency seen notification sent for emergency ${emergency.id}`);
    } catch (error) {
      console.error('Failed to send emergency seen notification:', error);
      throw error;
    }
  }

  private async sendEmergencyEndedNotification(emergency: Emergency, authHeader?: string): Promise<void> {
    try {
      const webhookConfig = this.secureConfig.webhookConfig;
      const n8nUrl = webhookConfig.n8nUrl;

      if (!n8nUrl || !emergency.user.phone) {
        console.log('Missing configuration or phone number for emergency ended notification');
        return;
      }

      // Extraer el token del header Authorization
      const bearerToken = authHeader?.replace('Bearer ', '') || '';

      if (!bearerToken) {
        console.log('No JWT token available for emergency ended notification');
        return;
      }

      const message = `✅ *Emergencia Finalizada* ✅\\n\\n🔒 Seguridad acaba de marcar como finalizada su emergencia:\\n\\n📋 *Título:* ${emergency.title}\\n📝 *Descripción:* ${emergency.description}\\n📅 *Fecha de inicio:* ${new Date(emergency.date).toLocaleDateString('es-AR')}\\n📅 *Fecha de finalización:* ${new Date().toLocaleDateString('es-AR')}\\n\\n🎉 Su emergencia ha sido resuelta exitosamente. Gracias por confiar en nuestro equipo de seguridad.`;

      const payload = {
        phoneNumber: emergency.user.phone,
        serverUrl: "https://evolution-api.altosdeviedma.com",
        message: message,
        instanceName: "AltosDeViedmaProduccion",
        apikey: "782A3BE06AAC-47C5-AE61-4985CB15631E"
      };

      const headers = {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      };

      await firstValueFrom(
        this.httpService.post(`${n8nUrl}/webhook/send-message`, payload, { headers })
      );

      console.log(`Emergency ended notification sent for emergency ${emergency.id}`);
    } catch (error) {
      console.error('Failed to send emergency ended notification:', error);
      throw error;
    }
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
