import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity({ name: 'support_ticket' })
export class SupportTicket extends BaseEntity {
  @Column({ name: 'stripe_parameter', type: 'varchar', nullable: true })
  stripeParameter?: string;

  @Column({ name: 'reason', type: 'varchar' })
  reason: string;

  @Column({ name: 'message', type: 'text' })
  message: string;

  @Column({ name: 'delivered_to_support_at', type: 'timestamp', default: null, nullable: true })
  deliveredToSupportAt?: Date;

  @Column({ name: 'delivered_to_customer_at', type: 'timestamp', default: null, nullable: true })
  deliveredToCustomerAt?: Date;

  @Column({ name: 'resolved_at', type: 'timestamp', default: null, nullable: true })
  resolvedAt?: Date;

  @ManyToOne(() => User, (user) => user.tickets)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;
}
