import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('settings')
export class Settings extends BaseEntity {
  @Column({ name: 'is_generate_cover_letter', default: false, nullable: false })
  isGenerateCoverLetter: boolean;

  @Column({ name: 'is_use_generated_cv', default: true, nullable: false })
  isUseGeneratedCv: boolean;

  @OneToOne(() => User, (user) => user.settings)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;
}
