import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // CONFIGURACIÓN GLOBAL DE TIMEZONE - BUENOS AIRES, ARGENTINA
  process.env.TZ = 'America/Argentina/Buenos_Aires';

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('ADVB API')
    .setDescription('Documentación de la API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Configure CORS properly - Allow all origins for testing
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection'
    ],
  });

  const port = process.env.PORT || 8345;
  
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Application running on port ${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();