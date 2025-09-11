import { existsSync } from 'fs';
import { join } from 'path';

import { Injectable, BadRequestException } from '@nestjs/common';


@Injectable()
export class FilesService {
  
  getStaticImage( imageName: string ) {

        const path = join( __dirname, '../../static/images', imageName );

        if ( !existsSync(path) ) 
            throw new BadRequestException(`No found with image ${ imageName }`);

        return path;
    }


}
