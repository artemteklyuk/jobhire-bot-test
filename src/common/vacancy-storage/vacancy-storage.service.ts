import { Model, Types } from 'mongoose';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PipelineStage } from 'mongoose';

import { Vacancy } from './schemas/vacancy.schema';
import { ResumeVacancy } from './schemas/resume-vacancy.schema';
import {
  JoinedResumeVacancy,
  UserVacanciesRequestType,
} from './vacancy-storage.types';

import {
  FindByIdMethod,
  TransformToObjectId,
} from './utils/vacancy-storage.decorators';
import {
  resumeVacancyQueryGenerators,
  resumeVacancyOrderTypes,
} from './utils/vacancy-storage.query-generators';

import { DEFAULT_USER_MATCH_RATE } from 'src/entities';
import utils from '../utils/utils';

export const FAKE_VACANCY_ID = new Types.ObjectId('000000000000000000000000');

type FieldsToSelect = {
  [key: string]: boolean;
};

@Injectable()
export class VacancyStorageService {
  constructor(
    @InjectModel(Vacancy.name)
    private vacancyModel: Model<Vacancy>,
    @InjectModel(ResumeVacancy.name)
    private resumeVacancyModel: Model<ResumeVacancy>,
  ) {}

  async findExistingVacanciesByHashedDescriptions(
    hashedDescriptions: any[],
  ): Promise<Vacancy[]> {
    return await this.vacancyModel
      .find({
        hashedAdditionalDescription: { $in: hashedDescriptions },
      })
      .lean();
  }

  async findOneResumeVacancyByVacancyId(
    userResumeIds: number[],
    vacancyId: Types.ObjectId,
  ): Promise<ResumeVacancy | null> {
    return await this.resumeVacancyModel
      .findOne({
        resumeId: { $in: userResumeIds },
        vacancyId,
      })
      .lean();
  }

  @FindByIdMethod
  async findOneVacancyById(
    @TransformToObjectId
    vacancyId: Types.ObjectId | string,
    fieldsToSelect?: FieldsToSelect,
  ): Promise<Vacancy | null> {
    return await this.vacancyModel
      .findById(vacancyId, this.getProjection(fieldsToSelect))
      .lean();
  }

  @FindByIdMethod
  async findOneResumeVacancyById(
    userResumeIds: number[],
    @TransformToObjectId
    resumeVacancyId: Types.ObjectId | string,
    fieldsToSelect?: FieldsToSelect,
  ): Promise<ResumeVacancy | null> {
    return await this.resumeVacancyModel
      .findOne(
        {
          resumeId: { $in: userResumeIds },
          _id: resumeVacancyId,
        },
        this.getProjection(fieldsToSelect),
      )
      .lean();
  }

  async findVacancyDuplicates(
    userResumeIds: number[],
    vacancyId: Types.ObjectId,
  ): Promise<ResumeVacancy[]> {
    const vacancy = await this.vacancyModel.findOne({ _id: vacancyId });

    if (!vacancy) {
      throw new Error(`Vacancy with id: ${vacancyId} not found`);
    }

    return await this.resumeVacancyModel.aggregate([
      {
        $match: {
          isRejectedByUser: null,
          respondedAt: null,
          vacancyId: { $ne: vacancyId },
          resumeId: { $in: userResumeIds },
        },
      },
      ...this.joinWithVacancy(),
      {
        $match: {
          'vacancy.title': {
            $regex: new RegExp(`^${vacancy.title.toLowerCase()}$`, 'i'),
          },
          'vacancy.hashedAdditionalDescription':
            vacancy.hashedAdditionalDescription,
          'vacancy.geo': vacancy.geo,
        },
      },
      {
        $project: { _id: 1 },
      },
    ]);
  }

  async updateVacancy(
    vacancyId: Types.ObjectId,
    fields: { [key: string]: any },
  ): Promise<void> {
    await this.vacancyModel.updateOne({ _id: vacancyId }, fields);
  }

  async updateResumeVacancy(
    resumeVacancyId: Types.ObjectId,
    fields: { [key: string]: any },
  ): Promise<void> {
    await this.resumeVacancyModel.updateOne({ _id: resumeVacancyId }, fields);
  }

  async updateManyResumeVacancies(
    resumeVacancyIds: Types.ObjectId[],
    fields: { [key: string]: any },
  ): Promise<void> {
    await this.resumeVacancyModel.updateMany(
      { _id: { $in: resumeVacancyIds } },
      fields,
    );
  }

  async saveVacancy(vacancy: Vacancy): Promise<Vacancy> {
    const newVacancy = new this.vacancyModel({
      title: vacancy.title,
      geo: vacancy.geo,
      description: vacancy.description,
      additionalDescription: vacancy.additionalDescription,
      hashedAdditionalDescription: vacancy.hashedAdditionalDescription,
      applyUrl: vacancy.applyUrl,
      parsedDate: vacancy.parsedDate,
      siteHost: vacancy.siteHost,
    });

    return await newVacancy.save();
  }

  async saveVacancies(vacancies: Vacancy[]): Promise<void> {
    await this.vacancyModel.insertMany(vacancies);
  }

  async saveResumeVacancies(resumeVacancies: ResumeVacancy[]): Promise<void> {
    await this.resumeVacancyModel.insertMany(resumeVacancies);
  }

  prepareVacancy({
    title,
    geo,
    description,
    additionalDescription,
    hashedAdditionalDescription,
    applyUrl,
    parsedDate,
    siteHost,
  }: {
    title: string;
    geo: string;
    description: string;
    additionalDescription: string;
    hashedAdditionalDescription: string;
    applyUrl: string;
    parsedDate: Date;
    siteHost: string;
  }): Vacancy {
    return new this.vacancyModel({
      _id: new Types.ObjectId(),
      title,
      geo,
      description,
      additionalDescription,
      hashedAdditionalDescription,
      applyUrl,
      parsedDate,
      siteHost,
    });
  }

  prepareResumeVacancy({
    vacancyId,
    resumeId,
    matchRate,
    coverLetter,
  }: {
    vacancyId: Types.ObjectId;
    resumeId: number;
    matchRate: number;
    coverLetter: string;
  }): ResumeVacancy {
    return new this.resumeVacancyModel({
      vacancyId,
      resumeId,
      matchRate,
      coverLetter,
    });
  }

  async getParsedTodayVacanciesCount(
    host: string,
    resumeId: number,
  ): Promise<number> {
    const { startOfDay, endOfDay } = utils.getDayBreakPoints();

    const count = await this.resumeVacancyModel.aggregate([
      ...this.joinWithVacancy(),
      {
        $match: {
          'vacancy.parsedDate': { $gte: startOfDay, $lte: endOfDay },
          'vacancy.siteHost': host,
          resumeId,
        },
      },
      { $count: 'total' },
    ]);

    return count.length > 0 ? count[0].total : 0;
  }

  async getRespondedTodayVacanciesCount(resumeId: number): Promise<number> {
    const { startOfDay, endOfDay } = utils.getDayBreakPoints();

    return await this.resumeVacancyModel.countDocuments({
      resumeId,
      isResponded: true,
      isErrored: false,
      respondedAt: { $gte: startOfDay, $lte: endOfDay },
    });
  }

  async getCurrentHostOldResumeVacancies(
    resumeId: number,
    matchRate: number,
    siteHost: string,
    limit: number,
  ): Promise<JoinedResumeVacancy[]> {
    const { startOfDay } = utils.getDayBreakPoints();
    const defaultCondition = this.getDefaultConditionToPrepairingVacancies(
      resumeId,
      matchRate,
    );

    return await this.resumeVacancyModel.aggregate([
      ...this.joinWithVacancyOptimizedForPreparation(siteHost),
      {
        $match: {
          ...defaultCondition,
          createdAt: { $lt: startOfDay, $gte: utils.getDateSubstractNDays(14) },
        },
      },
      { $sort: { matchRate: -1 } },
      { $limit: limit },
    ]);
  }

  async getCurrentHostResumeVacancies(
    resumeId: number,
    matchRate: number,
    siteHost: string,
    limit: number,
  ): Promise<JoinedResumeVacancy[]> {
    const defaultCondition = this.getDefaultConditionToPrepairingVacancies(
      resumeId,
      matchRate,
    );
    const now = new Date();

    return await this.resumeVacancyModel.aggregate([
      ...this.joinWithVacancyOptimizedForPreparation(siteHost),
      {
        $match: {
          $or: [
            { ...defaultCondition, scheduledAt: { $lt: now } },
            { ...defaultCondition, isRejectedByUser: false },
          ],
        },
      },
      { $sort: { matchRate: -1 } },
      { $limit: limit },
    ]);
  }

  async getVacanciesByStatus(
    resumeIds: number[],
    status: UserVacanciesRequestType,
    offset: number,
    vacanciesPerPage: number,
    matchRate?: number,
  ): Promise<JoinedResumeVacancy[]> {
    const filterPartFabric = resumeVacancyQueryGenerators.get(status);

    if (!filterPartFabric) {
      throw new NotFoundException(`Query type ${status} not found`);
    }

    const filterPart = filterPartFabric(matchRate);

    const initialFilter = {
      resumeId: { $in: resumeIds },
      vacancyId: { $ne: FAKE_VACANCY_ID },
    };

    const filter = Array.isArray(filterPart)
      ? filterPart.map((part) => ({ ...initialFilter, ...part }))
      : { ...initialFilter, ...filterPart };

    const sort = resumeVacancyOrderTypes.get(status);

    if (!sort) {
      throw new Error(`Order type of ${status} not found`);
    }

    return await this.resumeVacancyModel.aggregate([
      ...this.joinWithVacancy(),
      { $match: filter },
      { $sort: sort },
      { $skip: offset * vacanciesPerPage },
      { $limit: vacanciesPerPage },
      {
        $project: {
          _id: 1,
          matchRate: 1,
          createdAt: 1,
          scheduledAt: 1,
          isRejectedByUser: 1,
          respondedAt: 1,
          vacancy: {
            _id: 1,
            title: 1,
            geo: 1,
            siteHost: 1,
          },
        },
      },
    ]);
  }

  async countVacanciesByResumeId(resumeId: number): Promise<number> {
    return await this.resumeVacancyModel.countDocuments({ resumeId });
  }

  async countVacanciesByStatus(
    resumeIds: number[],
    status: UserVacanciesRequestType,
    matchRate?: number,
  ): Promise<number> {
    const filterPartFabric = resumeVacancyQueryGenerators.get(status);

    if (!filterPartFabric) {
      throw new NotFoundException(`Query type ${status} not found`);
    }

    const filterPart = filterPartFabric(matchRate);

    const initialFilter = {
      resumeId: { $in: resumeIds },
      vacancyId: { $ne: FAKE_VACANCY_ID },
    };

    const filter = Array.isArray(filterPart)
      ? filterPart.map((part) => ({ ...initialFilter, ...part }))
      : { ...initialFilter, ...filterPart };

    return await this.resumeVacancyModel.countDocuments(filter);
  }

  async getRespondStatistics(
    resumeIds: number[],
    userMatchRate: number,
  ): Promise<any> {
    const currentDate = new Date();

    const match: PipelineStage.Match = {
      $match: {
        resumeId: { $in: resumeIds },
        vacancyId: { $ne: FAKE_VACANCY_ID },
      },
    };

    const project: PipelineStage.Project = {
      $project: {
        _id: 1,
        respondedAt: 1,
        isResponded: 1,
        isRejectedByUser: 1,
        scheduledAt: 1,
        vacancyMatchRate: '$matchRate',
        userMatchRate: userMatchRate,
      },
    };

    const conditions = {
      successApplications: { $eq: ['$isResponded', true] },
      totalApplications: { $ne: ['$respondedAt', null] },
      waitingApplications: {
        $and: [
          { $eq: ['$respondedAt', null] },
          { $gt: ['$scheduledAt', currentDate] },
          { $eq: ['$isRejectedByUser', null] },
          {
            $or: [
              {
                $and: [
                  { $eq: ['$userMatchRate', null] },
                  { $gte: ['$vacancyMatchRate', DEFAULT_USER_MATCH_RATE] },
                ],
              },
              { $gte: ['$userMatchRate', '$vacancyMatchRate'] },
            ],
          },
        ],
      },
      queuedApplications: {
        $and: [
          { $eq: ['$respondedAt', null] },
          { $lt: ['$scheduledAt', currentDate] },
          {
            $or: [
              { $eq: ['$isRejectedByUser', null] },
              { $eq: ['$isRejectedByUser', false] },
            ],
          },
          {
            $or: [
              {
                $and: [
                  { $eq: ['$userMatchRate', null] },
                  { $gte: ['$vacancyMatchRate', DEFAULT_USER_MATCH_RATE] },
                ],
              },
              { $gte: ['$userMatchRate', '$vacancyMatchRate'] },
            ],
          },
        ],
      },
    };

    const group: PipelineStage.Group = {
      $group: {
        _id: null,
        successApplicationsCount: {
          $sum: { $cond: [conditions.successApplications, 1, 0] },
        },
        totalApplicationsCount: {
          $sum: { $cond: [conditions.totalApplications, 1, 0] },
        },
        waitingApplicationsCount: {
          $sum: { $cond: [conditions.waitingApplications, 1, 0] },
        },
        queuedApplicationsCount: {
          $sum: { $cond: [conditions.queuedApplications, 1, 0] },
        },
      },
    };

    const result = await this.resumeVacancyModel.aggregate([
      match,
      project,
      group,
    ]);
    const respondStatistics = result[0];

    if (respondStatistics) {
      delete respondStatistics._id;
      return respondStatistics;
    }

    return {
      successApplicationsCount: 0,
      totalApplicationsCount: 0,
      waitingApplicationsCount: 0,
      queuedApplicationsCount: 0,
    };
  }

  async countRespondedVacancies(resumeIds: number[]): Promise<number> {
    return await this.resumeVacancyModel.countDocuments({
      resumeId: { $in: resumeIds },
      isResponded: true,
      vacancyId: { $ne: FAKE_VACANCY_ID },
    });
  }

  async countRespondedVacanciesWithFakeResponds(
    resumeIds: number[],
  ): Promise<number> {
    return await this.resumeVacancyModel.countDocuments({
      resumeId: { $in: resumeIds },
      isResponded: true,
    });
  }

  async setSuccessfulRespond(resumeVacancyId: Types.ObjectId): Promise<void> {
    await this.resumeVacancyModel.updateOne(
      { _id: resumeVacancyId },
      { isResponded: true, respondedAt: new Date() },
    );
  }

  async getVacancyById(vacancyId: Types.ObjectId): Promise<Vacancy | null> {
    return await this.vacancyModel.findOne({ _id: vacancyId }).lean();
  }

  private getProjection(fieldsToSelect?: FieldsToSelect): object | undefined {
    if (fieldsToSelect) {
      const select = {};
      for (const [key, value] of Object.entries(fieldsToSelect)) {
        select[key] = value ? 1 : 0;
      }
      return select;
    }

    return undefined;
  }

  private joinWithVacancy() {
    return [
      {
        $lookup: {
          from: 'vacancy',
          localField: 'vacancyId',
          foreignField: '_id',
          as: 'vacancy',
        },
      },
      { $unwind: '$vacancy' },
    ];
  }

  private joinWithVacancyOptimizedForPreparation(siteHost: string) {
    return [
      {
        $lookup: {
          from: 'vacancy',
          let: { vacancyId: '$vacancyId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$vacancyId'] },
                    { $eq: ['$siteHost', siteHost] },
                    { $eq: ['$expiredAt', null] },
                  ],
                },
              },
            },
          ],
          as: 'vacancy',
        },
      },
      { $unwind: '$vacancy' },
    ];
  }

  private getDefaultConditionToPrepairingVacancies(
    resumeId: number,
    matchRate: number,
  ): any {
    const { startOfDay, endOfDay } = utils.getDayBreakPoints();

    return {
      resumeId,
      isResponded: false,
      isErrored: false,
      matchRate: { $gte: matchRate },
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      isRejectedByUser: null,
    };
  }

  async findResumeWithSuccessfulResponses(
    maxDateForFind: string,
    daysOfDifference: number,
    responsesCount: number,
  ): Promise<{ _id: number; count: number }[]> {
    const maxDate = new Date(maxDateForFind);
    const minDate = new Date(
      maxDate.getTime() - daysOfDifference * 24 * 60 * 60 * 1000,
    );
    const resumeVacancy = await this.resumeVacancyModel.aggregate([
      {
        $match: {
          createdAt: {
            $lt: maxDate,
            $gte: minDate,
          },
          isResponded: true,
        },
      },
      {
        $group: {
          _id: '$resumeId',
          count: {
            $sum: 1,
          },
        },
      },
      {
        $match: {
          _id: {
            $ne: null,
          },
          count: {
            $gt: responsesCount,
          },
        },
      },
    ]);
    return resumeVacancy;
  }

  async findResumeVacancyByResumeId(
    resumeId: number,
  ): Promise<ResumeVacancy[]> {
    try {
      const resumeVacancy = await this.resumeVacancyModel
        .find({
          resumeId,
        })
        .lean();

      if (!resumeVacancy) {
        throw new NotFoundException('resumeVacancy не найдены');
      }
      return resumeVacancy;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }
}
