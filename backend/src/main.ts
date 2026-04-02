import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CORS_ALLOWED_ORIGIN } from './cors.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: CORS_ALLOWED_ORIGIN,
  });

  await app.listen(3000);
}
bootstrap();
