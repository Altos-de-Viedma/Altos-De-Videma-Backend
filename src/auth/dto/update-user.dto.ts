import { IsString, MinLength, MaxLength, Matches, IsArray, IsOptional } from 'class-validator';

// DTO para actualizar usuario - todos los campos son opcionales
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength( 6 )
  @MaxLength( 50 )
  @Matches(
    /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'The password must have a Uppercase, lowercase letter and a number'
  } )
  password?: string;

  @IsOptional()
  @IsString()
  @MinLength( 2 )
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength( 2 )
  lastName?: string;

  @IsOptional()
  @IsString()
  @MinLength( 2 )
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength( 2 )
  address?: string;

  @IsOptional()
  @IsArray()
  @IsString( { each: true } )
  @MinLength( 1, { each: true } )
  roles?: string[];
}
