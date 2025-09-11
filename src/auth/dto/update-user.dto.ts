import { PartialType } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches, IsArray } from 'class-validator';

import { User } from '../entities/user.entity';

export class UpdateUserDto extends PartialType( User ) {
  @IsString()
  username: string;

  @IsString()
  @MinLength( 6 )
  @MaxLength( 50 )
  @Matches(
    /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'The password must have a Uppercase, lowercase letter and a number'
  } )
  password: string;

  @IsString()
  @MinLength( 2 )
  name: string;

  @IsString()
  @MinLength( 2 )
  lastName: string;

  @IsString()
  @MinLength( 2 )
  phone: string;

  @IsString()
  @MinLength( 2 )
  address: string;

  @IsArray()
  @IsString( { each: true } )
  @MinLength( 1, { each: true } )
  roles: string[];
}
