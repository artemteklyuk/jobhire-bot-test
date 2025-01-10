import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { CHAT_GPT_CONFIG } from './gpt.config';
import { GetTypeForGPTFunction, GptSchemaFunctionKey } from './gpt-functions/types';
import { GptFunctionRepository } from './gpt-functions/functions';

type GptFunctionExtraParams = {
  model?: string;
  log?: boolean;
};

const GET_DATA_FOR_FUNCTION_DEFAULT_OPTIONS: GptFunctionExtraParams = {
  model: CHAT_GPT_CONFIG.model,
  log: true,
};

@Injectable()
export class ChatGptService {
  private readonly openAI: OpenAI;
  private readonly logger = new Logger(ChatGptService.name);

  constructor(private readonly config: ConfigService) {
    this.openAI = new OpenAI({
      apiKey: 'sk-proj-ZCOMCBAPEbP4DYdY9UVoT3BlbkFJdB8n1XjMbKcg1LkjlCUr',
    });
  }

  /**
   *
   * @deprecated лучше использовать апи функций
   */
  public async generateMessageFromText(text, system: string, additionalSystem?: string) {
    return await this.openAI.chat.completions.create(
      {
        messages: [
          {
            role: 'system',
            content: !!additionalSystem ? `${system} ${additionalSystem}` : system,
          },
          { role: 'user', content: text },
        ],
        model: CHAT_GPT_CONFIG.model,
      },
      {
        maxRetries: CHAT_GPT_CONFIG.maxRetries,
      }
    );
  }

  /**
   * Название может слегка путать, но суть в том
   * что API GPT не исполняет функцию, а лишь подготавливает
   * для нее входные данные в соответствии с JSON Schema,
   * что мы им передаем с нашей стороны
   *
   * @link https://json-schema.org/understanding-json-schema/reference
   * @link https://www.learnjsonschema.com/2020-12/
   *
   * @param content содержимое из которого нужно извлечь поля для функции
   */
  public async getDataForFunction(
    { functionKey, content }: { functionKey: 'extract-cv-data'; content: string },
    params?: GptFunctionExtraParams
  ): Promise<GetTypeForGPTFunction<'extract-cv-data'>>;

  public async getDataForFunction(
    { functionKey, content }: { functionKey: 'fill-application-form'; content: string },
    params?: GptFunctionExtraParams
  ): Promise<GetTypeForGPTFunction<'fill-application-form'>>;

  public async getDataForFunction(
    { functionKey, content }: { functionKey: 'generate-cover-letter-and-match-rate'; content: string },
    params?: GptFunctionExtraParams
  ): Promise<GetTypeForGPTFunction<'generate-cover-letter-and-match-rate'>>;

  public async getDataForFunction(
    {
      functionKey,
      content,
    }: { functionKey: 'generate-cover-letter-and-match-rate-with-changed-prompt'; content: string },
    params?: GptFunctionExtraParams
  ): Promise<GetTypeForGPTFunction<'generate-cover-letter-and-match-rate-with-changed-prompt'>>;

  public async getDataForFunction(
    { functionKey, content }: { functionKey: 'prepare-data-for-generating-cv'; content: string },
    params?: GptFunctionExtraParams
  ): Promise<GetTypeForGPTFunction<'prepare-data-for-generating-cv'>>;

  public async getDataForFunction(
    { functionKey, content }: { functionKey: GptSchemaFunctionKey & string; content: string },
    params?: GptFunctionExtraParams
  ): Promise<GetTypeForGPTFunction<typeof functionKey>> {
    const {
      schema: { func, roles },
    } = GptFunctionRepository.getFunction(functionKey);

    const { model, log } = {
      ...GET_DATA_FOR_FUNCTION_DEFAULT_OPTIONS,
      ...params,
    } as NonNullable<GptFunctionExtraParams>;

    const request = await this.openAI.chat.completions.create({
      tools: [
        {
          type: 'function',
          function: func,
        },
      ],
      tool_choice: {
        function: {
          name: func.name,
        },
        type: 'function',
      },
      messages: [
        ...roles,
        {
          role: 'user',
          content,
        },
      ],
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      model,
    });

    const rawResponse = request.choices.find(
      (response) => !!response.message.tool_calls && response.message.tool_calls.length > 0
    );

    if (log) {
      this.logger.log('Chat GPT request done', {
        request: {
          function: func.name,
          content,
          model,
        },
        response: request.choices,
      });
    }

    if (!rawResponse) {
      throw new Error('GPT Request failed: no content');
    }

    const responseString = rawResponse.message.tool_calls?.find((call) => call.type === 'function')?.function.arguments;
    if (!responseString) {
      throw new Error('GPT Request failed: no function arguments extracted');
    }

    return JSON.parse(responseString) as GetTypeForGPTFunction<typeof functionKey>;
  }
}
