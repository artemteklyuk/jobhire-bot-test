import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { PreparedCvData } from './types/prepared-cv-data.types';

@Entity('preloaded_cv')
export class PreloadedCv extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'link_token', type: 'varchar', unique: true })
  linkToken: string;

  @Column({ name: 'registered', type: 'boolean', default: false })
  isRegistered: boolean;

  @Column({ name: 'file', type: 'varchar' })
  file: string;

  @Column({ name: 'cv_content', type: 'text' })
  cvContent: string;

  @Column({ name: 'first_name', type: 'varchar', nullable: true })
  firstName?: string;

  @Column({ name: 'last_name', type: 'varchar', nullable: true })
  lastName?: string;

  @Column({ name: 'email', type: 'varchar', nullable: true })
  email?: string;

  @Column({ name: 'extracted_properties', type: 'jsonb', nullable: true, default: null })
  extractedProperties?: PreparedCvData;

  @Column({ name: 'is_extraction_failed', type: 'boolean', nullable: true, default: null })
  isExtractionFailed?: boolean;
}
