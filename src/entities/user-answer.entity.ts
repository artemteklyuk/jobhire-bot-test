import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { UserQuestion } from './user-question.entity';
import { BaseEntity } from './base.entity';

@Entity('user_answer')
export class UserAnswer extends BaseEntity {
  @Column('text', { name: 'answer', array: true, default: null, nullable: true })
  answer: string[];

  @Column({ name: 'is_answered', default: false })
  isAnswered: boolean = false;

  @ManyToOne(() => User, (user) => user.questions)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @ManyToOne(() => UserQuestion, (userQuestion) => userQuestion.question)
  @JoinColumn({ name: 'user_question_id', referencedColumnName: 'id' })
  userQuestion: UserQuestion;
}
