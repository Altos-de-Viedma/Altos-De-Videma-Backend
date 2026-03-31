import { Controller, Get, Post, Body, UseGuards, Req, Headers, Param, Delete, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';

import { IncomingHttpHeaders } from 'http';

import { AuthService } from './auth.service';
import { RawHeaders, GetUser, Auth } from './decorators';
import { RoleProtected } from './decorators/role-protected.decorator';

import { CreateUserDto, LoginUserDto } from './dto';
import { User } from './entities/user.entity';
import { UserRoleGuard } from './guards/user-role.guard';
import { ValidRoles } from './interfaces';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags( 'Auth' )
@Controller( 'auth' )
export class AuthController {

  constructor(
    private readonly authService: AuthService
  ) { }

  @Post( 'register' )

  createUser( @Body() createUserDto: CreateUserDto ) {
    return this.authService.create( createUserDto );
  }

  @Post( 'login' )
  loginUser( @Body() loginUserDto: LoginUserDto ) {
    return this.authService.login( loginUserDto );
  }

  @Get( 'check-status' )
  @Auth()
  checkAuthStatus(
    @GetUser() user: User
  ) {
    return this.authService.checkAuthStatus( user );
  }

  @Get()
  @Auth()
  getAll() {
    console.log('🔍 GET /auth endpoint called');
    return this.authService.findAllActive();
  }

  @Get( 'inactive' )
  @Auth( ValidRoles.admin )
  getAllInactive() {
    return this.authService.findAllInactive();
  }

  @Get( ':id' )
  @Auth()
  getUser( @Param( 'id' ) id: string ) {
    return this.authService.getUser( id );
  }

  @Get( 'phone/:phone' )
  @Auth( ValidRoles.admin )
  getUserByPhone( @Param( 'phone' ) phone: string ) {
    return this.authService.getUserByPhone( phone );
  }

  @Patch( ':id' )
  @Auth( ValidRoles.admin )
  updateUser( @Param( 'id' ) id: string, @Body() updateUserDto: UpdateUserDto ) {
    return this.authService.update( id, updateUserDto );
  }

  @Delete( ':id' )
  @Auth( ValidRoles.admin )
  deleteUser( @Param( 'id' ) id: string ) {
    return this.authService.remove( id );
  }

  @Patch( 'activate/:id' )
  @Auth( ValidRoles.admin )
  activateUser( @Param( 'id' ) id: string ) {
    return this.authService.activateUser( id );
  }

  @Get( 'private' )
  @UseGuards( AuthGuard() )
  testingPrivateRoute(
    @Req() request: Express.Request,
    @GetUser() user: User,
    @GetUser( 'email' ) userEmail: string,

    @RawHeaders() rawHeaders: string[],
    @Headers() headers: IncomingHttpHeaders,
  ) {

    return {
      ok: true,
      message: 'Hola Mundo Private',
      user,
      userEmail,
      rawHeaders,
      headers
    };
  }

  @Get( 'private2' )
  @RoleProtected( ValidRoles.admin, ValidRoles.admin )
  @UseGuards( AuthGuard(), UserRoleGuard )
  privateRoute2(
    @GetUser() user: User
  ) {

    return {
      ok: true,
      user
    };
  }

  @Get( 'private3' )
  @Auth( ValidRoles.admin )
  privateRoute3(
    @GetUser() user: User
  ) {

    return {
      ok: true,
      user
    };
  }

  @Post( 'seed' )
  @Auth( ValidRoles.admin )
  seedDatabase(
    @GetUser() user: User
  ) {
    return this.authService.seedDatabase();
  }

  @Get( 'security/phones' )
  @Auth()
  getSecurityPhones(
    @GetUser() user: User
  ) {
    return this.authService.getSecurityPhones();
  }

  @Get( 'admin/phones' )
  @Auth( ValidRoles.admin )
  getAdminPhones(
    @GetUser() user: User
  ) {
    return this.authService.getAdminPhones();
  }

}
