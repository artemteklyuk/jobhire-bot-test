import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ collection: 'vacancy', timestamps: true })
export class Vacancy {
  @Prop()
  _id: Types.ObjectId;

  @Prop()
  title: string;

  @Prop()
  geo: string;

  @Prop()
  description: string;

  @Prop()
  additionalDescription: string;

  @Prop({ required: true })
  applyUrl: string;

  @Prop()
  parsedDate: Date;

  @Prop({ required: true })
  siteHost: string;

  @Prop()
  hashedAdditionalDescription: string;

  @Prop({ type: Object, required: false })
  parsedProperties?: any;

  @Prop({ required: false, default: null })
  expiredAt: Date;
}

export const VacancySchema = SchemaFactory.createForClass(Vacancy);

VacancySchema.index({ hashedAdditionalDescription: 1 });
