import { Module } from '@nestjs/common';
import { AnthropicService } from './anthropic.service';
import { ChatGptService } from './chat-gpt.service';

@Module({
  providers: [AnthropicService, ChatGptService],
  exports: [AnthropicService, ChatGptService],
})
export class GptModule {}
