import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { PreparedSendPulseDataType } from './types/prepared-send-pulse-data/prepared-send-pulse-data.types';

export enum PreparedVacanciesSendPulseDataTypes {
  BasePreparedSendPulseDataType = 1,
}

export interface IBasePreparedSendPulseData {
  type: PreparedVacanciesSendPulseDataTypes.BasePreparedSendPulseDataType;
}

@Entity('prepared_send_pulse_data')
export class PreparedSendPulseData extends BaseEntity {
  @Column('integer', { name: 'type' })
  type?: PreparedVacanciesSendPulseDataTypes.BasePreparedSendPulseDataType;

  @Column('jsonb', { name: 'data' })
  data: PreparedSendPulseDataType;

  @ManyToOne(() => User, (user) => user.preparedSendPulseData)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;
}
