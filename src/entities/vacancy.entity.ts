import { Entity, Column, OneToMany, JoinColumn } from 'typeorm';
import { ResumeVacancy } from './resume-vacancy.entity';
import { BaseEntity } from './base.entity';

export type VacancyProperties = {
  workingSchedule: string | null;
  salary: string | null;
  description: string | null;
  benefits: string[] | null;
  qualifications?: string[] | null;
};

@Entity('vacancy')
export class Vacancy extends BaseEntity {
  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'geo' })
  geo: string;

  @Column({ name: 'description' })
  description: string;

  @Column({ name: 'additional_description' })
  additionalDescription: string;

  @Column({ name: 'hashed_additional_description', nullable: true })
  hashedAdditionalDescription: string;

  @Column({ name: 'apply_url' })
  applyUrl: string;

  @Column({ name: 'parsed_date' })
  parsedDate: Date;

  @Column({ name: 'site_host' })
  siteHost: string;

  @Column({ name: 'parsed_properties', type: 'jsonb', nullable: true })
  parsedProperties?: VacancyProperties;

  // TODO удалить связи
  @OneToMany(() => ResumeVacancy, (resumeVacancy) => resumeVacancy.vacancy)
  @JoinColumn({ name: 'id', referencedColumnName: 'vacancy_id' })
  resume: ResumeVacancy[];
}
