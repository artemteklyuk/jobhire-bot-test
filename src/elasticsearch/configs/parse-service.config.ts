import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModuleAsyncOptions } from '@nestjs/elasticsearch';

export const config: ElasticsearchModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService<unknown, true>) => ({
    node: 'http://5.161.179.231:9200',
    auth: {
      apiKey: 'MVNud0tKSUIycUFfdEpreG13RUU6QzAzUV9ERXBTem1kbTZMM3czY2FSUQ==',
    },
  }),
};
