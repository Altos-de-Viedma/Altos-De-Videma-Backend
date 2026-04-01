import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { Package } from './entities/package.entity';
import { User } from '../auth/entities/user.entity';
import { Property } from '../property/entities/property.entity';
import { ConfigService as SecureConfigService } from '../config/config.service';

@Injectable()
export class PackageService {
  private readonly secureConfig = new SecureConfigService();

  constructor(
    @InjectRepository( Package )
    private packageRepository: Repository<Package>,
    @InjectRepository( Property )
    private propertyRepository: Repository<Property>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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
    const packageFound = await this.packageRepository.findOne({
      where: { id },
      relations: ['user', 'property']
    });
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


  async markAsReceived( id: string, user: User, authHeader?: string ) {
    const packageToUpdate = await this.findOne( id );

    if ( !user.roles.includes( 'admin' ) && !user.roles.includes( 'security' ) && packageToUpdate.user.id !== user.id ) {
      throw new ForbiddenException( 'You do not have permission to mark this package as received' );
    }

    packageToUpdate.received = true;
    const updatedPackage = await this.packageRepository.save( packageToUpdate );

    // Enviar notificación a N8N después de marcar como recibido
    try {
      await this.sendPackageReceivedNotification(packageToUpdate, authHeader);
    } catch (error) {
      console.error('Error sending package received notification:', error);
      // No lanzamos el error para no afectar la funcionalidad principal
    }

    return updatedPackage;
  }

  private async sendPackageReceivedNotification(packageEntity: Package, authHeader?: string): Promise<void> {
    try {
      const webhookConfig = this.secureConfig.webhookConfig;
      const n8nUrl = webhookConfig.n8nUrl;
      const evolutionApiUrl = this.configService.get('EVOLUTION_API_URL');

      if (!n8nUrl || !evolutionApiUrl || !packageEntity.user.phone) {
        console.log('Missing configuration or phone number for package received notification');
        return;
      }

      // Extraer el token del header Authorization
      const bearerToken = authHeader?.replace('Bearer ', '') || '';

      if (!bearerToken) {
        console.log('No JWT token available for package received notification');
        return;
      }

      const message = `📦 *Paquete Recibido* 📦

✅ Seguridad acaba de confirmar que recibió su paquete:

📋 *Título:* ${packageEntity.title}
📝 *Descripción:* ${packageEntity.description}
🏠 *Propiedad:* ${packageEntity.property.address}
📅 *Fecha de recepción:* ${new Date().toLocaleDateString('es-AR')}

¡Su paquete está listo para ser retirado! 🎉`;

      const payload = {
        phoneNumber: packageEntity.user.phone,
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
        this.httpService.post(`${n8nUrl}/send-message`, payload, { headers })
      );

      console.log(`Package received notification sent for package ${packageEntity.id}`);
    } catch (error) {
      console.error('Failed to send package received notification:', error);
      throw error;
    }
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