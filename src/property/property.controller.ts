import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

import { Auth, GetUser } from '../auth/decorators';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyService } from './property.service';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { ValidRoles } from '../auth/interfaces';
import { User } from '../auth/entities/user.entity';


@Controller( 'property' )
export class PropertyController {

  constructor(
    private readonly propertyService: PropertyService
  ) { }

  @Post()
  @Auth( ValidRoles.admin )
  create( @Body() createPropertyDto: CreatePropertyDto ) {
    return this.propertyService.create( createPropertyDto );
  }

  @Get()
  @Auth()
  findAll() {
    return this.propertyService.findAll();
  }

  @Get( 'user/:userId' )
  @Auth()
  findByUser( @Param( 'userId' ) userId: string ) {
    return this.propertyService.findByUser( userId );
  }

  @Get( 'my-properties' )
  @Auth()
  findMyProperties( @GetUser() user: User ) {
    return this.propertyService.findByUser( user.id );
  }

  @Patch( 'set-main/:id' )
  @Auth()
  setMainProperty( @Param( 'id' ) id: string, @GetUser() user: User ) {
    return this.propertyService.setMainProperty( id, user );
  }

  @Get( ':id' )
  @Auth()
  findOne( @Param( 'id' ) id: string ) {
    return this.propertyService.findOne( id );
  }

  @Patch( ':id' )
  @Auth()
  update( @Param( 'id' ) id: string, @Body() updatePropertyDto: UpdatePropertyDto ) {
    return this.propertyService.update( id, updatePropertyDto );
  }

  @Delete( ':id' )
  @Auth( ValidRoles.admin )
  remove( @Param( 'id' ) id: string ) {
    return this.propertyService.remove( id );
  }
}
