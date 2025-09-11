import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create( AppModule );

  const logger = new Logger( 'Bootstrap' );

  app.use( ( req, res, next ) => {
    res.header( 'Access-Control-Allow-Origin', req.headers.origin );
    res.header( 'Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS' );
    res.header( 'Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization' );
    res.header( 'Access-Control-Allow-Credentials', 'true' );
    if ( req.method === 'OPTIONS' ) {
      res.sendStatus( 200 );
    } else {
      next();
    }
  } );

  app.setGlobalPrefix( 'api' );

  app.useGlobalPipes(
    new ValidationPipe( {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    } )
  );

  const config = new DocumentBuilder()
    .setTitle( 'Visualiza RESTFul API' )
    .setDescription( 'Visualiza shop endpoints' )
    .setVersion( '1.0' )
    .build();
  const document = SwaggerModule.createDocument( app, config );
  SwaggerModule.setup( 'api', app, document );

  await app.listen( process.env.PORT, '0.0.0.0' );
  logger.log( `App running on port ${ process.env.PORT }` );
}
bootstrap();