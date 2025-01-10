import { Controller, Get } from '@nestjs/common';

import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CryptoStrategy } from './crypto-strategy';
import { BrowserBotFillerService } from './modules/browser-bot/services';
import { BrowserBotService } from './modules/browser-bot/browser-bot.service';
import { ResumeService } from './modules/resume/resume.service';
import { BOT_ACTIONS } from './common/consts/start-bot.consts';

@Entity('passwords')
export class UserPassword {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'method', type: 'smallint' })
  method: HashStrategies;

  @Column({ name: 'value', type: 'varchar' })
  value: string;

  @Column({ name: 'salt', type: 'varchar', nullable: true })
  salt?: string;

  @Column({ name: 'extra', type: 'jsonb', nullable: true })
  extra?: object;
}

const enum HashStrategies {
  OLD_BCRYPT,
  HMAC_SHA512,
}

type Password = Pick<UserPassword, 'value' | 'salt' | 'extra'>;

interface PasswordHashStrategy {
  hash(target: string): Promise<Password>;
  verify(target: string, original: Password): Promise<boolean>;
}

dayjs.extend(utc);
@Controller()
export class AppController {
  constructor(private readonly resumeService: ResumeService) {} // private readonly resumeRepository: Repository<Resume>, // @InjectRepository(Resume) // @InjectRepository(User) private readonly userRepository: Repository<User>,

  @Get()
  private async getHello() {
    this.resumeService.startResumeBotForUser('233', [
      {
        [BOT_ACTIONS.fillForm]: true,
      },
    ]);
  }
}
