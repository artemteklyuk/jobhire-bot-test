import { Module } from '@nestjs/common';
import { FormFillerService } from './form-filler.service';
import { LevelFillerStrategy } from './strategies/level.strategy';

@Module({
  providers: [FormFillerService, LevelFillerStrategy],
  exports: [FormFillerService],
})
export class FormFillerModule {}
