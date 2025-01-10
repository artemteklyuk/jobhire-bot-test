import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Resume } from './resume.entity';
import { ResumeQuestion } from './resume-question.entity';
import { BaseEntity } from './base.entity';

@Entity('resume_answer')
export class ResumeAnswer extends BaseEntity {
  @Column('text', { name: 'answer', array: true, default: null, nullable: true })
  answer: string[];

  @Column({ name: 'is_answered', default: false })
  isAnswered: boolean = false;

  @ManyToOne(() => Resume, (resume) => resume.questions)
  @JoinColumn({ name: 'resume_id', referencedColumnName: 'id' })
  resume: Resume;

  @ManyToOne(() => ResumeQuestion, (resumeQuestion) => resumeQuestion.resumeQuestionAnswers)
  @JoinColumn({ name: 'resume_question_id', referencedColumnName: 'id' })
  resumeQuestion: ResumeQuestion;
}
