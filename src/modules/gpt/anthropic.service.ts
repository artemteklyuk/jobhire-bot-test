import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ConfigService } from '@nestjs/config';
import { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import { ANTHROPIC_GPT_CONFIG } from './gpt.config';

@Injectable()
export class AnthropicService {
  private readonly anthropic: Anthropic;

  constructor(private readonly config: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: config.get('ANTHROPIC_API_KEY'),
    });
  }

  private async generateMessage(messages: MessageParam[], additionalSystem?: string) {
    return this.anthropic.messages.create({
      model: ANTHROPIC_GPT_CONFIG.model,
      max_tokens: ANTHROPIC_GPT_CONFIG.maxTokens,
      temperature: ANTHROPIC_GPT_CONFIG.temperature,
      system: !!additionalSystem ? `${ANTHROPIC_GPT_CONFIG.system} ${additionalSystem}` : ANTHROPIC_GPT_CONFIG.system,
      messages: messages,
    });
  }

  public async generateMessageFromText(
    message: string,
    additionalSystem?: string
  ): Promise<Anthropic.Messages.Message> {
    const preparedMessages: MessageParam[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: message,
          },
        ],
      },
    ];

    return this.generateMessage(preparedMessages, additionalSystem);
  }
}
