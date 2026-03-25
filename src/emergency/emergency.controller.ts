import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';

import { EmergencyService } from './emergency.service';
import { CreateEmergencyDto } from './dto/create-emergency.dto';
import { UpdateEmergencyDto } from './dto/update-emergency.dto';
import { Auth, GetUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';

@Controller( 'emergency' )
export class EmergencyController {

  constructor(
    private readonly emergencyService: EmergencyService
  ) { }

  @Post()
  @Auth()
  create( @Body() createEmergencyDto: CreateEmergencyDto, @GetUser() user: User ) {
    return this.emergencyService.create( createEmergencyDto, user );
  }

  @Get()
  @Auth()
  findAll() {
    return this.emergencyService.findAll();
  }

  @Get( ':id' )
  @Auth()
  findOne( @Param( 'id' ) id: string ) {
    return this.emergencyService.findOne( id );
  }

  @Get( 'user/:userId' )
  @Auth()
  findByUser( @Param( 'userId' ) userId: string ) {
    return this.emergencyService.findByUser( userId );
  }

  @Patch( ':id' )
  @Auth()
  update( @Param( 'id' ) id: string, @Body() updateEmergencyDto: UpdateEmergencyDto ) {
    return this.emergencyService.update( id, updateEmergencyDto );
  }

  @Patch( '/end/:id' )
  @Auth()
  emergencyEnded( @Param( 'id' ) id: string, @GetUser() user: User, @Headers('authorization') authHeader: string ) {
    return this.emergencyService.emergencyEnded( id, user, authHeader );
  }

  @Patch( '/seen/:id' )
  @Auth()
  markAsSeen( @Param( 'id' ) id: string, @GetUser() user: User, @Headers('authorization') authHeader: string ) {
    return this.emergencyService.markAsSeen( id, user, authHeader );
  }

  @Delete( ':id' )
  @Auth()
  remove( @Param( 'id' ) id: string ) {
    return this.emergencyService.remove( id );
  }
}
