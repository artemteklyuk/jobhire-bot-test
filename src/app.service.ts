import {
  MessageHandlerErrorBehavior,
  Nack,
  RabbitHeader,
  RabbitPayload,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import { setTimeout as wait } from 'node:timers/promises';
import { Injectable } from '@nestjs/common';
import { BOT_QUEUE_SETTINGS } from './rabbitmq/bot.queue.settings';

@Injectable()
export class AppService {
  @RabbitSubscribe({
    ...BOT_QUEUE_SETTINGS.subscriberOptions,
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  public async startBot(
    @RabbitPayload() content,
    @RabbitHeader() headers: any,
  ) {
    try {
      console.log('start task');
      console.log(headers);
      console.log(content);
      await wait(5000);
      console.log('throw Error');
      throw new Error();
    } catch (error) {
      console.log('nack');
      return new Nack(true);
    }
  }
}
