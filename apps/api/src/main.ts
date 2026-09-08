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
  // Écoute restreinte à la boucle locale. L'API n'a délibérément aucune
  // authentification (outil local-first mono-utilisateur), ce qui n'est
  // défendable que si elle reste injoignable depuis le réseau. Sans cet hôte,
  // `listen` se lie à 0.0.0.0 : n'importe qui sur le même wifi peut alors lire
  // et modifier les portefeuilles, et le DPIA du 08/08 — qui fonde tout son
  // raisonnement sur le caractère strictement local du traitement — ne tient
  // plus. HOST reste surchargeable pour un déploiement conteneurisé, où
  // l'isolation réseau est assurée par ailleurs.
  const host = process.env.HOST || '127.0.0.1';
  await app.listen(port, host);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(
    `📖 Swagger docs available at: http://localhost:${port}/api/docs`,
  );
}

bootstrap();
