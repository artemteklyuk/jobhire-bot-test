import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Resume } from './resume.entity';
import { Vacancy } from './vacancy.entity';
import { BaseEntity } from './base.entity';

@Entity('resume_vacancy')
export class ResumeVacancy extends BaseEntity {
  @Column({ name: 'is_responded', default: false })
  isResponded: boolean;

  @Column({ name: 'responded_at', nullable: true, default: null })
  respondedAt: Date;

  @Column({ name: 'is_errored', default: false })
  isErrored: boolean;

  @Column({ name: 'match_rate', nullable: true, default: null })
  matchRate: number;

  @Column({ name: 'cover_letter', nullable: true, default: null })
  coverLetter: string;

  @Column({
    name: 'scheduled_at',
    type: 'timestamp',
    nullable: false,
    default: () => `CURRENT_TIMESTAMP + INTERVAL '24 hours'`,
  })
  scheduledAt: Date;

  @Column({ name: 'is_rejected_by_user', type: 'boolean', nullable: true, default: null })
  isRejectedByUser?: boolean;

  @ManyToOne(() => Resume, (resume) => resume.vacancies)
  @JoinColumn({ name: 'resume_id', referencedColumnName: 'id' })
  resume: Resume;

  @ManyToOne(() => Vacancy, (vacancy) => vacancy.resume)
  @JoinColumn({ name: 'vacancy_id', referencedColumnName: 'id' })
  vacancy: Vacancy;
}
