import { EnvironmentService } from '@core/environment';
import { getLogger } from '@core/utils';
import {
  INestApplication,
  Logger,
  ValidationPipe,
  VersioningType,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';

const serviceName = 'icc-vmr-ms-signup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // get main services
  const environmentSrvc = app.get(EnvironmentService);
  const logger = app.get(Logger);

  // use app
  app.setGlobalPrefix(serviceName);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: [VERSION_NEUTRAL],
  });
  app.useGlobalPipes(new ValidationPipe());
  app.useLogger(
    WinstonModule.createLogger({
      instance: getLogger(environmentSrvc.isProd, {
        service: 'signup',
        type: 'ms',
        system: 'icc-vmr',
      }),
    }),
  );

  // get variables
  const port = environmentSrvc.getEnvironmentValue('PORT');

  // validations
  if (environmentSrvc.isSwaggerEnabled) enableSwagger(app, port, logger);

  await app.listen(port, () => {
    logger.log(`${serviceName} run in port ${port}`);
  });
}

function enableSwagger(app: INestApplication, port: number, logger: Logger) {
  const config = new DocumentBuilder()
    .setTitle(serviceName)
    .setDescription('Microservice for signup tenants')
    .setVersion('1.0')
    .setExternalDoc('Postman collection', '/api-json')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  logger.log(`[Swagger URL]: http://localhost:${port}/api-doc`);
  logger.log(`[Postman JSON]: http://localhost:${port}/api-doc-json`);

  SwaggerModule.setup('api-doc', app, document);
}

bootstrap();
