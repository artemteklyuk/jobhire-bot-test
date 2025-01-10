import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('pages_meta')
export class PageMeta extends BaseEntity {
  @Column('varchar', { name: 'path', unique: true })
  path: string;

  @Column('varchar', { name: 'meta_title' })
  metaTitle: string;

  @Column('varchar', { name: 'meta_description' })
  metaDescription: string;

  @Column('json', { name: 'extra' })
  extra: object;
}
