import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 4000;
  const apiPrefix = configService.get<string>('API_PREFIX') ?? 'api';
  const corsOrigin = configService.get<string>('CORS_ORIGIN') ?? '*';

  // --- Security & performance middleware ---
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    credentials: true,
  });

  // --- Routing convention ---
  app.setGlobalPrefix(apiPrefix);

  // --- Validation: strips unknown fields, rejects invalid ones, auto-transforms types ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // --- Consistent error response shape (success responses are returned as-is) ---
  app.useGlobalFilters(new AllExceptionsFilter());

  // --- API documentation (bonus) ---
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Eduvia Student Management API')
    .setDescription(
      'REST API for managing students in the Eduvia Student Management Dashboard.',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  app.enableShutdownHooks();

  await app.listen(port);

  Logger.log(
    `🚀 Server running at http://localhost:${port}/${apiPrefix}`,
    'Bootstrap',
  );
  Logger.log(
    `📚 Swagger docs available at http://localhost:${port}/docs`,
    'Bootstrap',
  );
}

bootstrap();
