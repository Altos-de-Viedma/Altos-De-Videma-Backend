import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DateTime } from 'luxon';
import * as bcrypt from 'bcryptjs';

import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginUserDto, CreateUserDto } from './dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository( User )
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) { }

  async create( createUserDto: CreateUserDto ) {
    try {
      const { password, ...userData } = createUserDto;
      const user = this.userRepository.create( {
        ...userData,
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

  async update( id: string, updateUserDto: UpdateUserDto ) {
    const user = await this.userRepository.preload( {
      id: id,
      ...updateUserDto
    } );

    if ( !user ) throw new NotFoundException( `User with id ${ id } not found` );

    try {
      await this.userRepository.save( user );
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

  async remove( id: string ) {
    const user = await this.userRepository.findOne( { where: { id } } );
    if ( !user ) throw new NotFoundException( `User with id ${ id } not found` );

    user.isActive = false;
    return this.userRepository.save( user );
  }

  private getJwtToken( payload: JwtPayload ) {
    const token = this.jwtService.sign( payload );
    return token;
  }

  private handleDBErrors( error: any ): never {
    if ( error.code === '23505' )
      throw new BadRequestException( error.detail );

    console.log( error );

    throw new InternalServerErrorException( 'Please check server logs' );
  }
}
