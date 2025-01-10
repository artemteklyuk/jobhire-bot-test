import { Column, Entity, JoinColumn, OneToMany } from 'typeorm';
import { ResumeAnswer } from './resume-answer.entity';
import { BaseEntity } from './base.entity';
import { QuestionAnswerEnum } from './types/question.entity.types';

@Entity('resume_question')
export class ResumeQuestion extends BaseEntity {
  @Column('text', { name: 'question' })
  question: string;

  @Column('text', { name: 'variants', array: true, default: null, nullable: true })
  variants: string[];

  @Column({
    name: 'answer_type',
    type: 'enum',
    enum: QuestionAnswerEnum,
    default: QuestionAnswerEnum.textField,
    transformer: {
      from(value) {
        return Number(value) as QuestionAnswerEnum;
      },
      to(value) {
        return value;
      },
    },
  })
  answerType: QuestionAnswerEnum;

  @Column({ name: 'serial_number', type: 'integer', nullable: false })
  serialNumber: number;

  @Column({ name: 'is_optional', type: 'boolean', default: false })
  isOptional: boolean;

  @OneToMany(() => ResumeAnswer, (resumeAnswer) => resumeAnswer.resumeQuestion)
  @JoinColumn({ name: 'id', referencedColumnName: 'resume_question_id' })
  resumeQuestionAnswers: ResumeAnswer;
}
