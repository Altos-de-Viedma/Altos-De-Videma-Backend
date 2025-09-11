import { IsOptional, IsString, IsUUID } from 'class-validator';

import { User } from 'src/auth/entities/user.entity';


export class CreatePropertyDto {

  @IsUUID()
  user: User;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  description?: string;
}
