import { Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { ExternalEvent } from './external-event.entity';
import { ExternalTask } from './external-task.entity';

@Entity('user_external_events')
export class UserExternalEvent extends BaseEntity {
  @ManyToOne(() => User, (user) => user.userEventGroups)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @ManyToOne(() => ExternalEvent, (externalEvent) => externalEvent.userExternalEvents)
  @JoinColumn({ name: 'external_event_id', referencedColumnName: 'id' })
  externalEvent: ExternalEvent;

  @OneToMany(() => ExternalTask, (task) => task.userExternalEvent)
  tasks: ExternalTask[];
}
