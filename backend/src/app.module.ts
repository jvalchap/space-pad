import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlocksModule } from './blocks/blocks.module';

@Module({
  imports: [BlocksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
