import { Column, Entity, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserQuestion } from './user-question.entity';

@Entity('question_group')
export class QuestionGroup extends BaseEntity {
  @Column({ type: 'varchar', name: 'title', unique: true })
  title: string;

  @Column({ type: 'integer', name: 'serial_number' })
  serialNumber: number;

  @Column({ type: 'varchar', name: 'description', nullable: false, default: null })
  description?: string;

  @OneToMany(() => UserQuestion, (userQuestion) => userQuestion.group)
  @JoinColumn({ name: 'id', referencedColumnName: 'question_group_id' })
  userQuestions: UserQuestion[];
}
