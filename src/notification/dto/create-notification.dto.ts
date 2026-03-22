import { IsString, IsUUID } from 'class-validator';



export class CreateNotificationDto {

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  link: string;

  @IsUUID()
  user: string;
}
