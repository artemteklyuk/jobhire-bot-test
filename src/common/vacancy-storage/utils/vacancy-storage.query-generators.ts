import { RootFilterQuery } from 'mongoose';

import { UserVacanciesRequestType } from '../vacancy-storage.types';
import { ResumeVacancy } from '../schemas/resume-vacancy.schema';
import { DEFAULT_USER_MATCH_RATE } from 'src/entities';

type ResumeVacancyQuery = RootFilterQuery<ResumeVacancy>;

export const resumeVacancyQueryGenerators: Map<UserVacanciesRequestType, (matchRate?: number) => any> = new Map([
  ['completed', () => ({ respondedAt: { $ne: null } }) as ResumeVacancyQuery],
  [
    'preview',
    (matchRate?: number) =>
      ({
        respondedAt: null,
        scheduledAt: { $gt: new Date() },
        isRejectedByUser: null,
        matchRate: { $gte: matchRate || DEFAULT_USER_MATCH_RATE },
      }) as ResumeVacancyQuery,
  ],
  [
    'queue',
    (matchRate?: number) =>
      ({
        $or: [
          {
            respondedAt: null,
            isRejectedByUser: false,
          },
          {
            respondedAt: null,
            isRejectedByUser: null,
            scheduledAt: { $lt: new Date() },
            matchRate: { $gte: matchRate || DEFAULT_USER_MATCH_RATE },
          },
        ],
      }) as ResumeVacancyQuery,
  ],
]);

export const resumeVacancyOrderTypes = new Map<UserVacanciesRequestType, { [key: string]: any }>([
  ['completed', { respondedAt: -1 }],
  ['preview', { scheduledAt: 1 }],
  ['queue', { scheduledAt: 1 }],
]);
