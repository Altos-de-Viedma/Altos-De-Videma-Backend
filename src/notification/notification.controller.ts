import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Auth, GetUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';

@Controller( 'notification' )
export class NotificationController {

  constructor(
    private readonly notificationService: NotificationService
  ) { }

  @Post()
  @Auth()
  create( @Body() createNotificationDto: CreateNotificationDto ) {
    return this.notificationService.create( createNotificationDto );
  }

  @Get()
  @Auth()
  findAll() {
    return this.notificationService.findAll();
  }

  @Get( ':id' )
  @Auth()
  findOne( @Param( 'id' ) id: string ) {
    return this.notificationService.findOne( id );
  }

  @Get( 'user/:userId' )
  @Auth()
  findAllByUser( @Param( 'userId' ) userId: string ) {
    return this.notificationService.findAllByUser( userId );
  }

  @Patch( 'mark-as-seen/:id' )
  @Auth()
  markAsSeen(
    @Param( 'id' ) id: string,
    @GetUser() user: User,
    @GetUser( 'isAdmin' ) isAdmin: boolean
  ) {
    return this.notificationService.markAsSeen( id, user.id, isAdmin );
  }

  @Patch( ':id' )
  @Auth()
  update( @Param( 'id' ) id: string, @Body() updateNotificationDto: UpdateNotificationDto ) {
    return this.notificationService.update( id, updateNotificationDto );
  }

  @Delete( ':id' )
  @Auth()
  remove( @Param( 'id' ) id: string ) {
    return this.notificationService.remove( id );
  }

}
