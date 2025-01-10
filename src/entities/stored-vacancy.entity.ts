import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum VacanciesProviders {
  Workable = 'workable',
}

export type EncodedData = {
  encodedTitle: string;
  encodedState: string;
};

export interface StoredVacancyInterface {
  id: number;
  title: string;
  type: string;
  remote: boolean;
  category: string;
  company: string;
  city?: string;
  state?: string;
  country: string;
  description: string;
  additionalDescription?: string;
  externalId: string;
  education?: string;
  experience?: string;
  applyUrl?: string;
  appearanceDate: Date;
  provider: VacanciesProviders;
  metaTitle: string;
  metaDescription: string;
  encoded: EncodedData;
}

@Entity('stored_vacancies')
export class StoredVacancy extends BaseEntity implements StoredVacancyInterface {
  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'type' })
  type: string;

  @Column({ name: 'remote', type: 'boolean', default: false })
  remote: boolean;

  @Column({ name: 'category' })
  category: string;

  @Column({ name: 'company' })
  company: string;

  @Column({ name: 'country' })
  country: string;

  @Column({ name: 'state', nullable: true, default: null })
  state: string;

  @Column({ name: 'city', nullable: true, default: null })
  city: string;

  @Column({ name: 'description' })
  description: string;

  @Column({ name: 'additional_description', nullable: true, default: null })
  additionalDescription?: string;

  @Column({ name: 'external_id', unique: true })
  externalId: string;

  @Column({ name: 'education', nullable: true, default: null })
  education?: string;

  @Column({ name: 'experience', nullable: true, default: null })
  experience?: string;

  @Column({ name: 'apply_url', nullable: true, default: null })
  applyUrl: string;

  @Index({ unique: false })
  @Column({ name: 'appearance_date', type: 'timestamp' })
  appearanceDate: Date;

  @Column({ name: 'provider' })
  provider: VacanciesProviders;

  @Column({ name: 'meta_title' })
  metaTitle: string;

  @Column({ name: 'meta_description' })
  metaDescription: string;

  @Column({ name: 'encoded', type: 'json' })
  encoded: EncodedData;
}
