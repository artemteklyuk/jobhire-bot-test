import {
  QueueOptions,
  RabbitMQConfig,
  RabbitMQExchangeConfig,
} from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';

export const DEFAULT_QUEUE_NAME = 'tickets';
const X_DELAYED_EXCHANGE_TYPE = 'x-delayed-message';

export const DEFAULT_QUEUE_PRIORITY = 2;
export const DEFAULT_MAX_QUEUE_PRIORITY = 5;
export const CONNECTION_NAME = DEFAULT_QUEUE_NAME.concat('-connection');
export const DELAYED_ROUTING_KEY = 'delayed-key';
export const IS_EXTERNAL_QUEUE_USED = true;
export const X_DELAYED_EXCHANGE_NAME = 'delayed-tickets';

const QUEUE_OPTIONS: QueueOptions = {
  durable: false,
  exclusive: false,

  maxPriority: IS_EXTERNAL_QUEUE_USED ? DEFAULT_MAX_QUEUE_PRIORITY : undefined,
};

export const externalExchange: RabbitMQExchangeConfig = {
  name: X_DELAYED_EXCHANGE_NAME,
  type: X_DELAYED_EXCHANGE_TYPE,
  createExchangeIfNotExists: true,
  options: {
    durable: true,
    arguments: {
      'x-delivery-limit': '3',
      'x-queue-type': 'quorum',
    },
  },
};

function rabbitMQConfig(config: ConfigService): RabbitMQConfig {
  return {
    name: CONNECTION_NAME,
    uri: 'amqp://guest:guest@localhost:5672',
    prefetchCount: 1,
    exchanges: [externalExchange],
    queues: [
      {
        name: DEFAULT_QUEUE_NAME,
        options: QUEUE_OPTIONS,
        bindQueueArguments: { 'x-queue-type': 'quorum' },
        exchange: IS_EXTERNAL_QUEUE_USED ? X_DELAYED_EXCHANGE_NAME : undefined,
        routingKey: IS_EXTERNAL_QUEUE_USED ? DELAYED_ROUTING_KEY : undefined,
      },
    ],
  };
}

export const BOT_QUEUE_SETTINGS = {
  queueOptions: QUEUE_OPTIONS,
  subscriberOptions: {
    connection: CONNECTION_NAME,
    queue: DEFAULT_QUEUE_NAME,
    queueOptions: QUEUE_OPTIONS,
  },
  dynamicModuleOptions: {
    imports: [],
    useFactory: (config: ConfigService) => rabbitMQConfig(config),
    inject: [ConfigService],
  },
};
