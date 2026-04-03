import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DateTime } from 'luxon';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';

import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginUserDto, CreateUserDto } from './dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Emergency } from '../emergency/entities/emergency.entity';
import { Package } from '../package/entities/package.entity';
import { Visitor } from '../visitor/entities/visitor.entity';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository( User )
    private readonly userRepository: Repository<User>,
    @InjectRepository( Emergency )
    private readonly emergencyRepository: Repository<Emergency>,
    @InjectRepository( Package )
    private readonly packageRepository: Repository<Package>,
    @InjectRepository( Visitor )
    private readonly visitorRepository: Repository<Visitor>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async create( createUserDto: CreateUserDto ) {
    try {
      const { password, ...userData } = createUserDto;

      // Asegurar que todos los usuarios tengan el rol 'user' por defecto
      const roles = userData.roles || [];
      if ( !roles.includes( 'user' ) ) {
        roles.push( 'user' );
      }

      // Formatear el número de teléfono
      if (userData.phone) {
        userData.phone = this.formatPhoneNumber(userData.phone);
      }

      const user = this.userRepository.create( {
        ...userData,
        roles,
        password: bcrypt.hashSync( password, 10 )
      } );
      await this.userRepository.save( user );
      delete user.password;
      return {
        ...user,
        token: this.getJwtToken( { id: user.id } )
      };
    } catch ( error ) {
      this.handleDBErrors( error );
    }
  }

  async login( loginUserDto: LoginUserDto ) {
    const { password, username } = loginUserDto;
    const user = await this.userRepository.findOne( {
      where: { username },
      select: {
        id: true,
        name: true,
        lastName: true,
        username: true,
        password: true,
        roles: true,
        lastActivity: true,
        isActive: true
      }
    } );

    if ( !user )
      throw new UnauthorizedException( 'Credentials are not valid (email)' );

    if ( !user.isActive )
      throw new UnauthorizedException( 'Usuario bloqueado. Contacte al administrador.' );

    if ( !bcrypt.compareSync( password, user.password ) )
      throw new UnauthorizedException( 'Credentials are not valid (password)' );

    const now = DateTime.now().setZone( 'America/Argentina/Buenos_Aires' );
    user.lastActivity = now.toJSDate();
    await this.userRepository.save( user );

    delete user.password;

    return {
      user: { ...user },
      token: this.getJwtToken( { id: user.id } )
    };
  }

  async checkAuthStatus( user: User ) {
    if ( !user.isActive )
      throw new UnauthorizedException( 'Usuario bloqueado. Contacte al administrador.' );

    return {
      ...user,
      token: this.getJwtToken( { id: user.id } )
    };
  }

  async getUser( id: string ) {
    const user = await this.userRepository.findOne( {
      where: { id },
      select: {
        id: true,
        name: true,
        lastName: true,
        username: true,
        phone: true,
        address: true,
        roles: true,
        lastActivity: true,
        isActive: true,
      }
    } );

    if ( !user )
      throw new NotFoundException( `User with id ${ id } not found` );

    return user;
  }

  async getUserByPhone( phone: string ) {
    const user = await this.userRepository.findOne( {
      where: { phone },
      relations: {
        properties: {
          visitors: true,
          packages: true,
        },
        emergency: true,
        package: true,
        notification: true,
      }
    } );

    if ( !user )
      throw new NotFoundException( `User with phone ${ phone } not found` );

    const emergencies = ( user.emergency as unknown as any[] ) || [];
    const packages = ( user.package as unknown as any[] ) || [];
    const properties = ( user.properties as unknown as any[] ) || [];

    const filteredEmergency = emergencies.filter( e => !e.emergencyEnded );
    const filteredPackage = packages.filter( p => !p.received );

    const filteredProperty = properties.map( prop => ( {
      ...prop,
      package: ( prop.package as any[] || [] ).filter( p => !p.received ),
      visitor: ( prop.visitor as any[] || [] ).filter( v => !v.visitCompleted )
    } ) );

    // Get unique visitors by DNI from all properties (past and future visits)
    // Prioritizing the most recent visit for each DNI
    const allVisitorsMap = new Map<string, any>();
    properties.forEach( prop => {
      const visitors = ( prop.visitor as any[] ) || [];
      visitors.forEach( visitor => {
        // Use DNI as unique identifier if available, otherwise use visitor id
        const uniqueKey = visitor.dni || visitor.id;
        
        const visitorData = {
          id: visitor.id,
          fullName: visitor.fullName,
          dni: visitor.dni,
          phone: visitor.phone,
          dateAndTimeOfVisit: visitor.dateAndTimeOfVisit,
          visitCompleted: visitor.visitCompleted,
          propertyAddress: prop.address,
          propertyId: prop.id,
          description: visitor.description,
          vehiclePlate: visitor.vehiclePlate,
          profilePicture: visitor.profilePicture,
          status: visitor.status,
          date: visitor.date
        };
        
        if ( !allVisitorsMap.has( uniqueKey ) ) {
          allVisitorsMap.set( uniqueKey, visitorData );
        } else {
          // Compare dates and keep the most recent visitor
          const existingVisitor = allVisitorsMap.get( uniqueKey );
          const existingDate = new Date( existingVisitor.date );
          const newDate = new Date( visitorData.date );
          
          if ( newDate > existingDate ) {
            allVisitorsMap.set( uniqueKey, visitorData );
          }
        }
      } );
    } );
    const uniqueVisitors = Array.from( allVisitorsMap.values() );

    return {
      ...user,
      emergency: filteredEmergency,
      package: filteredPackage,
      property: filteredProperty,
      visitors: uniqueVisitors,
      token: this.getJwtToken( { id: user.id } )
    };
  }

  async update( id: string, updateUserDto: UpdateUserDto ) {
    if ( updateUserDto.password ) {
      updateUserDto.password = bcrypt.hashSync( updateUserDto.password, 10 );
    }

    // Formatear el número de teléfono si se está actualizando
    if (updateUserDto.phone) {
      updateUserDto.phone = this.formatPhoneNumber(updateUserDto.phone);
    }

    const user = await this.userRepository.preload( {
      id: id,
      ...updateUserDto
    } );

    if ( !user ) throw new NotFoundException( `User with id ${ id } not found` );

    try {
      await this.userRepository.save( user );
      delete user.password;
      return user;
    } catch ( error ) {
      this.handleDBErrors( error );
    }
  }

  async findAllActive() {
    return this.userRepository.find( {
      where: { isActive: true }
    } );
  }

  async findAllInactive() {
    return this.userRepository.find( {
      where: { isActive: false }
    } );
  }

  async activateUser( id: string ) {
    const user = await this.userRepository.findOne( { where: { id } } );
    if ( !user ) throw new NotFoundException( `User with id ${ id } not found` );

    user.isActive = true;
    return this.userRepository.save( user );
  }

  async remove( id: string ) {
    const user = await this.userRepository.findOne( { where: { id } } );
    if ( !user ) throw new NotFoundException( `User with id ${ id } not found` );

    user.isActive = false;
    return this.userRepository.save( user );
  }

  async seedDatabase() {
    try {
      // Borrar todas las emergencias
      await this.emergencyRepository.clear();

      // Borrar todos los paquetes
      await this.packageRepository.clear();

      // Borrar todos los visitantes
      await this.visitorRepository.clear();

      return {
        ok: true,
        message: 'Database seeded successfully',
        deleted: {
          emergencies: 'All emergencies deleted',
          packages: 'All packages deleted',
          visitors: 'All visitors deleted'
        }
      };
    } catch (error) {
      console.error('Error seeding database:', error);
      throw new InternalServerErrorException('Error seeding database');
    }
  }

  async getSecurityPhones() {
    try {
      const securityUsers = await this.userRepository
        .createQueryBuilder('user')
        .where('user.isActive = :isActive', { isActive: true })
        .andWhere(':role = ANY(user.roles)', { role: 'security' })
        .select(['user.phone'])
        .getMany();

      if (securityUsers.length === 0) {
        return [];
      }

      const phones = securityUsers
        .filter(user => user.phone) // Solo usuarios con teléfono
        .map(user => ({ phone: user.phone })); // Objeto con propiedad phone

      return phones;
    } catch (error) {
      console.error('Error getting security phones:', error);
      throw new InternalServerErrorException('Error getting security phones');
    }
  }

  async getAdminPhones() {
    try {
      const adminUsers = await this.userRepository
        .createQueryBuilder('user')
        .where('user.isActive = :isActive', { isActive: true })
        .andWhere(':role = ANY(user.roles)', { role: 'admin' })
        .select(['user.phone'])
        .getMany();

      if (adminUsers.length === 0) {
        return [];
      }

      const phones = adminUsers
        .filter(user => user.phone) // Solo usuarios con teléfono
        .map(user => ({ phone: user.phone }));

      return phones;
    } catch (error) {
      console.error('Error getting admin phones:', error);
      throw new InternalServerErrorException('Error getting admin phones');
    }
  }

  private formatPhoneNumber(phone: string): string {
    if (!phone) return phone;

    // Remover espacios y caracteres especiales
    let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Si ya empieza con 549, no hacer nada
    if (cleanPhone.startsWith('549')) {
      return cleanPhone;
    }

    // Si empieza con +549, remover el +
    if (cleanPhone.startsWith('+549')) {
      return cleanPhone.substring(1);
    }

    // Si empieza con 54, agregar 9
    if (cleanPhone.startsWith('54') && !cleanPhone.startsWith('549')) {
      return '549' + cleanPhone.substring(2);
    }

    // Si no empieza con 54, agregar 549 al inicio
    return '549' + cleanPhone;
  }

  private getJwtToken( payload: JwtPayload ) {
    const token = this.jwtService.sign( payload, {
      expiresIn: this.configService.get('JWT_EXPIRATION') || '1d',
    });
    return token;
  }

  private handleDBErrors( error: any ): never {
    if ( error.code === '23505' )
      throw new BadRequestException( error.detail );

    console.log( error );

    throw new InternalServerErrorException( 'Please check server logs' );
  }
}
