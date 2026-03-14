import { IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';

import { User } from '../../auth/entities/user.entity';


export class CreatePropertyDto {

  @IsUUID()
  user: User;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}
