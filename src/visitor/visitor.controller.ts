import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';

import { Auth, GetUser } from '../auth/decorators';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';
import { VisitorService } from './visitor.service';
import { User } from '../auth/entities/user.entity';

@Controller( 'visitor' )
export class VisitorController {

  constructor(
    private readonly visitorService: VisitorService
  ) { }

  @Post()
  @Auth()
  create( @Body() createVisitorDto: CreateVisitorDto ) {
    // Debug logging to help identify N8N data issues
    console.log('=== VISITOR CREATION DEBUG ===');
    console.log('Received data:', JSON.stringify(createVisitorDto, null, 2));
    console.log('Property field:', createVisitorDto.property);
    console.log('Property type:', typeof createVisitorDto.property);
    console.log('Is property a valid UUID?', /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(createVisitorDto.property || ''));
    console.log('==============================');

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
  visitCompleted( @Param( 'id' ) id: string, @GetUser() user: User, @Headers('authorization') authHeader: string ) {
    return this.visitorService.visitCompleted( id, user, authHeader );
  }

  @Delete( ':id' )
  @Auth()
  remove( @Param( 'id' ) id: string ) {
    return this.visitorService.remove( id );
  }
}
