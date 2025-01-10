import { Entity, Column, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { ResumeAnswer } from './resume-answer.entity';
import { ResumeVacancy } from './resume-vacancy.entity';
import { User } from './user.entity';
import { BaseEntity } from './base.entity';
import { GeneratedCv } from './generated-cv.entity';
import { ResumeSerial, ResumeStatus } from './types/resume.entity.types';

@Entity('resume')
export class Resume extends BaseEntity {
  @Column({ name: 'serial_number', type: 'enum', enum: ResumeSerial })
  serialNumber: ResumeSerial;

  @Column({ name: 'speciality', nullable: true, default: null })
  specialty: string;

  @Column({ name: 'cv_file_url', nullable: true, default: null })
  cvFileUrl: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ResumeStatus,
    default: ResumeStatus.DISABLED,
  })
  status: ResumeStatus;

  @Column({ name: 'resume_text', nullable: true, default: null })
  cvText: string;

  @ManyToOne(() => GeneratedCv, (generatedCv) => generatedCv.resumes)
  @JoinColumn({ name: 'generated_cv_id', referencedColumnName: 'id' })
  generatedCv: GeneratedCv | null;

  @OneToMany(() => ResumeAnswer, (resumeAnswer) => resumeAnswer.resume)
  @JoinColumn({ name: 'id', referencedColumnName: 'resume_id' })
  questions: ResumeAnswer[];

  // TODO удалить связи
  @OneToMany(() => ResumeVacancy, (resumeVacancy) => resumeVacancy.resume)
  @JoinColumn({ name: 'id', referencedColumnName: 'resume_id' })
  vacancies: ResumeVacancy[];

  @ManyToOne(() => User, (user) => user.resume)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;
}
