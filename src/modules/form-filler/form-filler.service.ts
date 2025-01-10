import { Inject, Injectable, Logger } from '@nestjs/common';
import { IFormFillerStrategy } from 'src/common/types/form-filler.strategy.interface';
import { LevelFillerStrategy } from './strategies/level.strategy';
import { JOB_PROVIDERS } from 'src/common/consts/job-providers.consts';

@Injectable()
export class FormFillerService {
  private readonly logger = new Logger(FormFillerService.name);
  private readonly strategies: { [key: string]: IFormFillerStrategy };

  constructor(
    @Inject(LevelFillerStrategy) private readonly levelFillerStrategy: IFormFillerStrategy
  ) {
    this.strategies = {
      [JOB_PROVIDERS.level.mainHost]: levelFillerStrategy,
    };
  }

  public getFormFillerInstance(host: string): IFormFillerStrategy {
    const strategy = this.strategies[host];
    if (!strategy) {
      throw new Error(`Not found strategy for form on site: ${host}`);
    }
    return strategy;
  }
}
