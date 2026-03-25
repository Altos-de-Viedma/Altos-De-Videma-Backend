import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';

import { PackageService } from './package.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { Auth, GetUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';
import { ValidRoles } from '../auth/interfaces';

@Controller( 'package' )
export class PackageController {
  constructor( private readonly packageService: PackageService ) { }

  @Post()
  @Auth()
  create( @Body() createPackageDto: CreatePackageDto, @GetUser() user: User ) {
    return this.packageService.create( createPackageDto, user );
  }


  @Get()
  @Auth()
  findAll() {
    return this.packageService.findAll();
  }

  @Get( 'user/packages' )
  @Auth()
  findAllByUser( @GetUser() user: User ) {
    return this.packageService.findAllByUser( user.id );
  }

  @Get( ':id' )
  @Auth()
  findOne( @Param( 'id' ) id: string ) {
    return this.packageService.findOne( id );
  }

  @Patch( ':id' )
  @Auth()
  update( @Param( 'id' ) id: string, @Body() updatePackageDto: UpdatePackageDto ) {
    return this.packageService.update( id, updatePackageDto );
  }

  @Patch( 'mark-as-received/:id' )
  @Auth()
  markAsReceived( @Param( 'id' ) id: string, @GetUser() user: User, @Headers('authorization') authHeader: string ) {
    return this.packageService.markAsReceived( id, user, authHeader );
  }

  @Delete( ':id' )
  @Auth()
  remove( @Param( 'id' ) id: string ) {
    return this.packageService.remove( id );
  }
}
