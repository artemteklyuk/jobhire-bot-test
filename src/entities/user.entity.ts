import { Entity, Column, OneToMany, JoinColumn, OneToOne } from 'typeorm';
import { Resume } from './resume.entity';
import { UserAnswer } from './user-answer.entity';
import { BaseEntity } from './base.entity';
import { Settings } from './settings.entity';
import { RegisteredAccount } from './registered-accounts.entity';
import { UserExternalEvent } from './user-external-event.entity';
import { PreparedSendPulseData } from './prepared-send-pulse-data.entity';
import { SupportTicket } from './support-ticket.entity';
import { UserMarketingTest } from './user-marketing-test.entity';

export const DEFAULT_USER_MATCH_RATE = 25;

@Entity('user')
export class User extends BaseEntity {
  @Column({ name: 'uid', unique: true })
  uid: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'email' })
  email: string;

  @Column({ name: 'address', nullable: true, default: null })
  address: string;

  @Column({ name: 'state', type: 'varchar', nullable: true, default: null })
  state?: string;

  @Column({ name: 'city', type: 'varchar', nullable: true, default: null })
  city?: string;

  @Column({ name: 'postal', type: 'varchar', nullable: true, default: null })
  postal?: string;

  @Column({ name: 'phone_number' })
  phoneNumber: string;

  @Column({ name: 'birth_date', nullable: true, default: null })
  birthDate: Date;

  @Column({ name: 'access_token', nullable: false })
  accessToken: string;

  @Column({ name: 'avaible_tokens', nullable: false, default: 3 })
  avaibleTokens: number;

  @Column({ name: 'is_bitter_truth', type: 'boolean', nullable: false, default: false })
  isRealInfo: boolean;

  @Column({ name: 'match_rate', nullable: false, default: DEFAULT_USER_MATCH_RATE })
  matchRate: number;

  @Column({ name: 'is_employed', type: 'boolean', nullable: true })
  isEmployed?: boolean;

  @OneToMany(() => UserAnswer, (userAnswer) => userAnswer.user)
  @JoinColumn({ name: 'id', referencedColumnName: 'user_id' })
  questions: UserAnswer[];

  @OneToMany(() => Resume, (resume) => resume.user)
  @JoinColumn({ name: 'id', referencedColumnName: 'user_id' })
  resume: Resume[];

  @OneToOne(() => Settings, (settings) => settings.user)
  settings: Settings;

  @OneToMany(() => RegisteredAccount, (registeredAccount) => registeredAccount.user)
  @JoinColumn({ name: 'id', referencedColumnName: 'user_id' })
  registeredAccounts: RegisteredAccount[];

  @OneToMany(() => UserExternalEvent, (userEventGroup) => userEventGroup.user)
  @JoinColumn({ name: 'id', referencedColumnName: 'user_id' })
  userEventGroups: UserExternalEvent[];

  @OneToMany(() => PreparedSendPulseData, (preparedSendPulseData) => preparedSendPulseData.user)
  @JoinColumn({ name: 'id', referencedColumnName: 'user_id' })
  preparedSendPulseData: PreparedSendPulseData[];

  @OneToMany(() => SupportTicket, (ticket) => ticket.user)
  tickets: SupportTicket[];

  @OneToMany(() => UserMarketingTest, (userMarketingTest) => userMarketingTest.user)
  @JoinColumn({ name: 'id', referencedColumnName: 'user_id' })
  userMarketingTests: UserMarketingTest[];
}
