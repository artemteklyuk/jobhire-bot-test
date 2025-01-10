import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserExternalEvent } from './user-external-event.entity';

@Entity('external_tasks')
export class ExternalTask extends BaseEntity {
  @Column({ name: 'type', type: 'varchar' })
  type: string;

  @Column({ name: 'expiration_date', type: 'timestamp', nullable: true })
  expirationDate?: Date;

  @Column({ name: 'freezed_until', type: 'timestamp', nullable: true })
  freezedUntil?: Date;

  @Column({ name: 'last_delivered_at', type: 'timestamp', nullable: true })
  lastDeliveredAt: Date;

  @Column({ name: 'acknowledged_at', type: 'timestamp', nullable: true })
  acknowledgedAt?: Date;

  @Column({ name: 'is_closed', type: 'boolean', default: false })
  isClosed: boolean;

  @Column({ name: 'serial', type: 'int', nullable: true })
  serial?: number;

  @Column({ name: 'data', type: 'jsonb', nullable: true })
  data?: any;

  @Column({ name: 'result', type: 'jsonb', nullable: true })
  result?: any;

  @ManyToOne(() => UserExternalEvent, (userEventGroup) => userEventGroup.tasks)
  @JoinColumn({ name: 'user_external_event_id', referencedColumnName: 'id' })
  userExternalEvent: UserExternalEvent;
}
