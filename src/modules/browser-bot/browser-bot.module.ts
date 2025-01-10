import { Module } from '@nestjs/common';
import { BrowserBotService } from './browser-bot.service';
import { FormFillerModule } from '../form-filler/form-filler.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrowserBotFillerService } from './services';
import { BrowserModule } from 'src/common/browser/browser.module';
import { Cookie, GeneratedCv, Resume, Settings } from 'src/entities';
import { AiFormFillerModule } from '../ai-form-filler/ai-form-filler.module';

@Module({
  imports: [
    BrowserModule,
    FormFillerModule,
    TypeOrmModule.forFeature([Resume, Cookie, Settings, GeneratedCv]),
    AiFormFillerModule,
  ],
  providers: [BrowserBotService, BrowserBotFillerService],
  controllers: [],
  exports: [BrowserBotService, BrowserBotFillerService],
})
export class BrowserBotModule {}
