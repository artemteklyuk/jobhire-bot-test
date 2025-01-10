import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('admin_settings')
export class AdminSettings extends BaseEntity {
  @Column({ name: 'is_used_tweaking', type: 'boolean', default: false })
  isUsedTweaking: boolean;

  @Column({ name: 'is_working_bot_parser', type: 'boolean', default: true })
  isWorkingBotParser: boolean;

  @Column({ name: 'is_working_bot_filler', type: 'boolean', default: true })
  isWorkingBotFiller: boolean;
}
