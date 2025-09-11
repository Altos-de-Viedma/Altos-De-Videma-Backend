import { IsString } from 'class-validator';


export class CreateEmergencyDto {

  @IsString()
  title: string;

  @IsString()
  description: string;

}
