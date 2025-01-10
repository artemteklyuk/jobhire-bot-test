import { BaseEntity } from './base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('user_marketing_test')
@Index(['user', 'name'], { unique: true })
export class UserMarketingTest extends BaseEntity {
  @Column({ name: 'name', type: 'varchar' })
  name: string;

  @Column({ name: 'data', type: 'jsonb', nullable: true, default: null })
  data?: any;

  @ManyToOne(() => User, (user) => user.userMarketingTests)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;
}
