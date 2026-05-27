import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve uploaded attachment files
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  // Enable CORS for frontend
  app.enableCors();

  // Global Prefix
  app.setGlobalPrefix('api');

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('EPCI Interface Management System API')
    .setDescription('The core API documentation for the EPCI IMS platform.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // --- BAGIAN YANG DIPERBARUI UNTUK CLOUD RUN ---
  const port = process.env.PORT || 3001;

  // Wajib menambahkan '0.0.0.0' agar network internal GCP bisa mengakses container
  await app.listen(port, '0.0.0.0');

  console.log(`Backend is running on port: ${port} (API Prefix: /api)`);
  console.log(`API Documentation available at: http://localhost:${port}/docs`);
}
bootstrap();