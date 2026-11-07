import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);

  // Security
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  }));
  app.use(compression());

  // CORS from config
  const corsOrigins = config.get<string[]>('security.cors.origins') || ['http://localhost:3000', 'http://localhost:3001'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Op-Id', 'X-Locale', 'X-Device-Id'],
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // API versioning
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.setGlobalPrefix('api');

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Logistics Oversight API')
    .setDescription('Logistics Oversight v2 - Full API documentation')
    .setVersion('2.0.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-Client-Op-Id', in: 'header' }, 'idempotency')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get<number>('API_PORT') || process.env.API_PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`API running on http://0.0.0.0:${port}`);
  logger.log(`Swagger docs: http://0.0.0.0:${port}/docs`);
}

bootstrap();
