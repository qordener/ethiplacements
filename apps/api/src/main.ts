/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const config = new DocumentBuilder()
    .setTitle('ethiplacements API')
    .setDescription('API de gestion de placements éthiques (ESG) — local-first')
    .setVersion('1.0')
    .addTag('portfolios', 'Gestion des portefeuilles')
    .addTag('assets', 'Actifs financiers')
    .addTag('esg-scores', 'Scores ESG')
    .addTag('holdings', 'Lignes de portefeuille')
    .addTag('transactions', 'Transactions (BUY / SELL / DIVIDEND)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(
    `📖 Swagger docs available at: http://localhost:${port}/api/docs`,
  );
}

bootstrap();
