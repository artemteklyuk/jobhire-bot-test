import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BOT_QUEUE_SETTINGS } from './rabbitmq/bot.queue.settings';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule } from '@nestjs/config';
import { options } from './typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectModule } from './modules/workable-parser/connect.module';
import { ResumeModule } from './modules/resume/resume.module';
import { BrowserBotModule } from './modules/browser-bot/browser-bot.module';

@Module({
  imports: [
    RabbitMQModule.forRootAsync(
      RabbitMQModule,
      BOT_QUEUE_SETTINGS.dynamicModuleOptions,
    ),
    TypeOrmModule.forRootAsync(options()),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ConnectModule,
    ResumeModule,
    BrowserBotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
