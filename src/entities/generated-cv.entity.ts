import { Column, Entity, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Resume } from './resume.entity';

@Entity('generated_cv')
export class GeneratedCv extends BaseEntity {
  @Column({ name: 'file_url', type: 'varchar', nullable: true })
  fileUrl: string | null;

  @Column({ name: 'source_hash', type: 'varchar', unique: true })
  sourceHash: string;

  @Column({ name: 'status', type: 'varchar', default: 'waiting' })
  status: 'waiting' | 'error' | 'success';

  @OneToMany(() => Resume, (resume) => resume.generatedCv)
  @JoinColumn({ name: 'id', referencedColumnName: 'generated_cv_id' })
  resumes: Resume[];
}
