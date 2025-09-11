import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

import { Auth, GetUser } from 'src/auth/decorators';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';
import { VisitorService } from './visitor.service';
import { User } from 'src/auth/entities/user.entity';

@Controller( 'visitor' )
export class VisitorController {

  constructor(
    private readonly visitorService: VisitorService
  ) { }

  @Post()
  @Auth()
  create( @Body() createVisitorDto: CreateVisitorDto ) {
    return this.visitorService.create( createVisitorDto );
  }

  @Get()
  @Auth()
  findAll() {
    return this.visitorService.findAll();
  }

  @Get( ':id' )
  @Auth()
  findOne( @Param( 'id' ) id: string ) {
    return this.visitorService.findOne( id );
  }

  @Patch( ':id' )
  @Auth()
  update( @Param( 'id' ) id: string, @Body() updateVisitorDto: UpdateVisitorDto ) {
    return this.visitorService.update( id, updateVisitorDto );
  }

  @Patch( 'visit-completed/:id' )
  @Auth()
  visitCompleted( @Param( 'id' ) id: string, @GetUser() user: User ) {
    return this.visitorService.visitCompleted( id, user );
  }

  @Delete( ':id' )
  @Auth()
  remove( @Param( 'id' ) id: string ) {
    return this.visitorService.remove( id );
  }
}
