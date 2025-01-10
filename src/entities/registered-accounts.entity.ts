import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('registered_account')
export class RegisteredAccount extends BaseEntity {
  @Column('varchar', { name: 'email' })
  email: string;

  @Column('varchar', { name: 'password' })
  password: string;

  @Column('varchar', { name: 'host' })
  host: string;

  @Column({ name: 'is_registered', type: 'boolean', default: false })
  isRegistered: boolean;

  @ManyToOne(() => User, (user) => user.registeredAccounts)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;
}
