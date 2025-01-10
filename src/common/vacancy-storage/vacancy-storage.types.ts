import { ResumeVacancy } from './schemas/resume-vacancy.schema';
import { Vacancy } from './schemas/vacancy.schema';

export type JoinedResumeVacancy = ResumeVacancy & { vacancy: Vacancy };

export const resumeVacancyStatuses = ['completed', 'preview', 'queue'] as const;
export type UserVacanciesRequestType = (typeof resumeVacancyStatuses)[number];
