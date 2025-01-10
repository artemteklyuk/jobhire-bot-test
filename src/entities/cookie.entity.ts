import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('cookie')
export class Cookie extends BaseEntity {
  @Column('json', { name: 'cookies' })
  cookies: object[];

  @Column({ name: 'is_used', type: 'boolean', default: false })
  isUsed: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
