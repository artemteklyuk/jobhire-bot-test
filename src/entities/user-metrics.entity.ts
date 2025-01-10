import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('user_metrics')
export class UserMetrics extends BaseEntity {
  @Column('text', { name: 'ext_uniq_id', unique: true })
  externalUniqueId: string;

  @Column('varchar', { name: 'internal_tracking_id', nullable: true, default: true })
  internalTrackingId?: string;

  @Column('text', { name: 'uid', nullable: true, default: null })
  uid: string;

  @Column('varchar', { name: 'email', nullable: true, default: null })
  email?: string;

  @Column({ name: 'metrics', type: 'jsonb' })
  metrics: any;
}
