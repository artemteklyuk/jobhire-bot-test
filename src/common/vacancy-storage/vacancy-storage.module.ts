import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Vacancy, VacancySchema } from './schemas/vacancy.schema';
import {
  ResumeVacancy,
  ResumeVacancySchema,
} from './schemas/resume-vacancy.schema';
import { VacancyStorageService } from './vacancy-storage.service';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb://jobhirereaduser:ViOw9pqzL51@5.161.116.5:27019/vacancy_storage?authSource=vacancy_storage&authMechanism=SCRAM-SHA-1',
    ),
    MongooseModule.forFeature([
      { name: Vacancy.name, schema: VacancySchema },
      { name: ResumeVacancy.name, schema: ResumeVacancySchema },
    ]),
  ],
  providers: [VacancyStorageService],
  exports: [MongooseModule, VacancyStorageService],
})
export class VacancyStorageModule {}
