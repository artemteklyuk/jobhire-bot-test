import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserExternalEvent } from './user-external-event.entity';

export enum OrderTypes {
  FREE = 'FREE',
  ORDERED = 'ORDERED',
}

@Entity('external_events')
export class ExternalEvent extends BaseEntity {
  @Column({ name: 'name', type: 'varchar' })
  name: string;

  @Column({ name: 'order_type', type: 'varchar', unique: true })
  orderType: OrderTypes;

  @OneToMany(() => UserExternalEvent, (userExternalEvent) => userExternalEvent.externalEvent)
  userExternalEvents: UserExternalEvent[];
}
