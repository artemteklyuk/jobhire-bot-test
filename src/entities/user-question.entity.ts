import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { UserAnswer } from './user-answer.entity';
import { BaseEntity } from './base.entity';
import { QuestionGroup } from './question-group.entity';
import { QuestionAnswerEnum } from './types/question.entity.types';

@Entity('user_question')
export class UserQuestion extends BaseEntity {
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
        return Number(value);
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

  @Column({ name: 'is_displayed', type: 'boolean', default: true })
  isDisplayed: boolean;

  @OneToMany(() => UserAnswer, (userAnswer) => userAnswer.userQuestion)
  @JoinColumn({ name: 'id', referencedColumnName: 'user_question_id' })
  userQuestionAnswer: UserAnswer;

  @ManyToOne(() => QuestionGroup, (group) => group.userQuestions)
  @JoinColumn({ name: 'question_group_id', referencedColumnName: 'id' })
  group?: QuestionGroup;
}
