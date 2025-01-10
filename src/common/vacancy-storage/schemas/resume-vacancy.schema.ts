import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ collection: 'resumeVacancy', timestamps: true })
export class ResumeVacancy {
  @Prop()
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vacancy', required: true })
  vacancyId: Types.ObjectId;

  @Prop({ required: true })
  resumeId: number;

  @Prop({ default: false })
  isResponded: boolean;

  @Prop()
  respondedAt: Date;

  @Prop({ required: true, default: false })
  isErrored: boolean;

  @Prop()
  matchRate: number;

  @Prop()
  coverLetter: string;

  @Prop({
    required: true,
    default: () => {
      const now = new Date();
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    },
  })
  scheduledAt: Date;

  @Prop()
  isRejectedByUser: boolean;
}

export const ResumeVacancySchema = SchemaFactory.createForClass(ResumeVacancy);
