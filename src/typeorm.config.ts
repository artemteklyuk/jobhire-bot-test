import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { PageMeta, StoredVacancy } from './entities';

const configService = new ConfigService();

export const dataSourceOptions = (
  config: ConfigService,
): DataSourceOptions => ({
  // type: 'postgres',
  // host: '5.161.203.215',
  // port: 5432,
  // username: 'root',
  // password: 'rootJMxhYy5kIB31ZYmBHczUag==',
  // database: 'jobhire_parse_manager',
  // synchronize: false,
  // entities: [],
  type: 'postgres',
  host: '5.161.185.205',
  port: 5432,
  username: 'root',
  password: 'DpOg_nwe3Vxa8Q',
  database: 'jobhire_core',
  synchronize: false,
  // migrations: [`${__dirname}/../**/migrations/*{.ts,.js}`],
  entities: [__dirname + '/**/*.entity.{js,ts}'],
});

export const options = () => ({
  imports: [],
  useFactory: (config: ConfigService) => dataSourceOptions(config),
  inject: [ConfigService],
});

export default new DataSource(dataSourceOptions(configService));
