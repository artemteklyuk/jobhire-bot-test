import { ChatGptService } from '../gpt/chat-gpt.service';
import { Module } from '@nestjs/common';
import { AiFormFillerService } from './ai-form-filler.service';

@Module({
  providers: [AiFormFillerService, ChatGptService],
  exports: [AiFormFillerService],
})
export class AiFormFillerModule {}
