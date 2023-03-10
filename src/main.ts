import { EnvironmentService } from '@core/environment';
import { LoggerInterceptor } from '@core/interceptors';
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

  // get environment services
  const environmentSrvc = app.get(EnvironmentService);

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
        type: 'microservice',
        system: 'icc-vmr',
      }),
    }),
  );
  app.useGlobalInterceptors(new LoggerInterceptor(Logger))


  // get variables
  const port = environmentSrvc.getEnvironmentValue('PORT');
  // validations
  if (environmentSrvc.isSwaggerEnabled) enableSwagger(app, port);

  await app.listen(port, () => {
    Logger.log(`${serviceName} run in port ${port}`);
  });
}

function enableSwagger(app: INestApplication, port: number) {
  const config = new DocumentBuilder()
    .setTitle(serviceName)
    .setDescription('Microservice for signup tenants')
    .setVersion('1.0')
    .setExternalDoc('Postman collection', '/api-doc-json')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  Logger.log(`[Swagger URL]: http://localhost:${port}/api-doc`);
  Logger.log(`[Postman JSON]: http://localhost:${port}/api-doc-json`);

  SwaggerModule.setup('api-doc', app, document);
}

bootstrap();
