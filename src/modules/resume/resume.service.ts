import {
  BadRequestException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, LessThanOrEqual, Not, Repository } from 'typeorm';
import { ResumeUpdateDto } from './dto/resume-update.dto';
import { FilesService } from '../files/files.service';
import { ConfigService } from '@nestjs/config';
import {
  Resume,
  ResumeAnswer,
  ResumeQuestion,
  User,
  UserAnswer,
  UserQuestion,
} from 'src/entities';
import {
  ActionTypes,
  EmployeeCVInfo,
} from 'src/common/types/employee-cv-info.types';
import { BrowserBotService } from '../browser-bot/browser-bot.service';
import {
  ResumeSerial,
  ResumeStatus,
} from 'src/common/types/resume.entity.types';
import { BOT_ACTIONS } from 'src/common/consts/start-bot.consts';
import * as textract from 'textract';

const EXPENSIVE_PLAN_IDS = ['15'];

@Injectable()
export class ResumeService {
  private readonly logger = new Logger(ResumeService.name);

  constructor(
    @InjectRepository(Resume)
    private readonly resumeRepository: Repository<Resume>,
    @InjectRepository(ResumeQuestion)
    private readonly resumeQuestionRepository: Repository<ResumeQuestion>,
    @InjectRepository(ResumeAnswer)
    private readonly resumeAnswerRepository: Repository<ResumeAnswer>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(UserQuestion)
    private readonly userQuestionRepository: Repository<UserQuestion>,
    @InjectRepository(UserAnswer)
    private readonly userAnswerRepository: Repository<UserAnswer>,
    private readonly browserBotService: BrowserBotService,
    private readonly filesService: FilesService,
    private readonly configService: ConfigService<unknown, true>,
  ) {}

  public async extractTextFromFileByUrl(fileUrl: string): Promise<string> {
    try {
      const storeUrl = 'https://api.jobhire.ai';
      return new Promise((resolve, reject) => {
        textract.fromUrl(`${storeUrl}/${fileUrl}`, (error, text) => {
          if (error) {
            reject(error);
          } else {
            resolve(text);
          }
        });
      });
    } catch (error) {
      throw error;
    }
  }

  private async startResumeBot(resumeId: number, action: ActionTypes) {
    this.logger.log(`Starting resume bot for ${resumeId}`);
    try {
      const currentResume = await this.resumeRepository.findOne({
        where: { id: resumeId },
        relations: {
          user: true,
        },
      });

      if (!currentResume) {
        this.logger.warn(`Not found resume by id ${resumeId}`);
        return;
      }

      const accountInfoQuestionsWithAnswers =
        await this.userAnswerRepository.find({
          where: {
            user: { id: currentResume.user.id },
          },
          relations: {
            userQuestion: true,
          },
        });

      const structuredAccountInfoQuestionsWithAnswers =
        accountInfoQuestionsWithAnswers.map((questionWithAnswer) => ({
          question: questionWithAnswer.userQuestion.question,
          answer: questionWithAnswer.answer,
        })) || [];

      const resumeQuestionsWithAnswers = await this.resumeAnswerRepository.find(
        {
          where: { resume: { id: resumeId } },
          relations: {
            resumeQuestion: true,
          },
        },
      );

      const structuredResumeQuestionsWithAnswers =
        resumeQuestionsWithAnswers.map((questionWithAnswer) => ({
          question: questionWithAnswer.resumeQuestion.question,
          answer: questionWithAnswer.answer,
        })) || [];

      const questions = [
        ...structuredAccountInfoQuestionsWithAnswers,
        ...structuredResumeQuestionsWithAnswers,
      ];
      const smtpUser = undefined;

      const preparedUserData: EmployeeCVInfo = {
        resumeId: resumeId,
        resumeSerial: currentResume.serialNumber,
        uid: currentResume.user.uid,
        specialty: currentResume.specialty,
        cvFileUrl: currentResume.cvFileUrl,
        firstName: currentResume.user.firstName,
        lastName: currentResume.user.lastName,
        email: currentResume.user.email,
        smtpEmail: smtpUser?.specialEmail,
        address: currentResume.user.address,
        phoneNumber: currentResume.user.phoneNumber,
        birthDate: currentResume.user.birthDate,
        questions: questions,
        action,
        matchRate: currentResume.user.matchRate,
      };

      const currentUser = await this.userRepository.findOne({
        where: { id: currentResume.user.id },
      });

      if (!currentUser) {
        return new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      this.logger.log({
        msg: `Starting bot for user => ${currentResume.user.uid}`,
        preparedUserData,
      });
      await this.browserBotService.startBot(preparedUserData);
    } catch (error) {
      this.logger.error(error.message, { error });

      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Internal Server Error',
          message: 'An error occurred while fetching resume questions.',
          details: error.message || error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async getUserResumeIds(userId: number): Promise<number[]> {
    const resumes = await this.resumeRepository.find({
      where: {
        user: { id: userId },
      },
      select: { id: true },
    });

    return resumes.map((resume) => resume.id);
  }

  public async startResumeBotForUser(
    uid: string,
    actions: ActionTypes[]
  ) {
    try {
      const resumes = await this.resumeRepository.find({
        where: {
          user: {
            uid,
          },
          status: ResumeStatus.ACTIVE,
        },
        select: {
          id: true,
        },
        relations: {
          user: true,
        },
      });

      if (resumes.length === 0) {
        throw new BadRequestException(`User ${uid} have no active resumes`);
      }

      for (const resume of resumes) {
        actions.map(async (action) => {
          await this.startResumeBot(resume.id, action);
        });
      }

      return {
        message: `Started ${resumes.map(({ id }) => id.toString()).join(', ')} resume(s) for user ${uid}`,
      };
    } catch (error) {
      this.logger.error(error.message, { error });

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException();
    }
  }

  public async getResumeQuestionsWithAnswers(resumeId: number, uid: string) {
    try {
      const questionsWithAnswers = await this.resumeQuestionRepository.find({
        where: {
          resumeQuestionAnswers: { resume: { id: resumeId, user: { uid } } },
        },
        relations: {
          resumeQuestionAnswers: true,
        },
      });

      const questionsWithAnswersIds = questionsWithAnswers.map(({ id }) => id);

      const questionsWithoutAnswers = await this.resumeQuestionRepository.find({
        where: { id: Not(In(questionsWithAnswersIds)) },
      });

      if (!questionsWithAnswers?.length) {
        this.logger.warn('questions with answers not found');
        return new HttpException(
          'questions with answers not found',
          HttpStatus.NOT_FOUND,
        );
      }

      return questionsWithAnswers
        .map((questionWithAnswer) => ({
          id: questionWithAnswer.id,
          question: questionWithAnswer.question,
          variants: questionWithAnswer.variants,
          answerType: questionWithAnswer.answerType,
          answer: questionWithAnswer.resumeQuestionAnswers[0].answer || null,
          serial: questionWithAnswer.serialNumber,
          isOptional: questionWithAnswer.isOptional,
        }))
        .concat(
          questionsWithoutAnswers.map((questionWithoutAnswers) => ({
            id: questionWithoutAnswers.id,
            question: questionWithoutAnswers.question,
            variants: questionWithoutAnswers.variants,
            answerType: questionWithoutAnswers.answerType,
            answer: null,
            serial: questionWithoutAnswers.serialNumber,
            isOptional: questionWithoutAnswers.isOptional,
          })),
        )
        .sort(({ serial: serialA }, { serial: serialB }) => serialA - serialB);
    } catch (error) {
      this.logger.error({ error });
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Internal Server Error',
          message: 'An error occurred while fetching resume questions.',
          details: error.message || error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async changeResumeStatus(resumeIds: number[], uid: string) {
    try {
      const currentUser = await this.userRepository.findOne({ where: { uid } });

      if (!currentUser) {
        this.logger.warn('User not found');
        return new HttpException(
          `User with uid ${uid} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      const countResumes = resumeIds.length;

      if (!countResumes) {
        this.logger.warn('Have not paid resume');
        return new HttpException('Have not paid resume', HttpStatus.FORBIDDEN);
      }

      const resumes = await this.resumeRepository.find({
        where: {
          id: In(resumeIds),
          serialNumber: LessThanOrEqual(countResumes),
        },
      });

      if (!resumes.length) {
        this.logger.warn('Bot found resume');
        throw new HttpException('Not found resumes', HttpStatus.NOT_FOUND);
      }

      const activeResumes = resumes.filter(
        (resume) => resume.status === ResumeStatus.ACTIVE,
      );

      if (activeResumes.length) {
        await this.resumeRepository.update(
          { id: In(resumes.map(({ id }) => id)) },
          { status: ResumeStatus.PAUSED },
        );
        return resumes.map(({ id }) => ({ [id]: ResumeStatus.PAUSED }));
      }

      await this.resumeRepository.update(
        { id: In(resumes.map(({ id }) => id)) },
        { status: ResumeStatus.ACTIVE },
      );

      for (const currentResume of resumes) {
        // await this.startResumeBot(
        //   currentResume.id,
        //   { [BOT_ACTIONS.parseJobs]: true },
        // );

        await this.startResumeBot(currentResume.id, {
          [BOT_ACTIONS.fillForm]: true,
        });
      }

      return resumes.map(({ id }) => ({ [id]: ResumeStatus.ACTIVE }));
    } catch (error) {
      this.logger.error({ error });
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Internal Server Error',
          message: 'An error occurred while fetching resume questions.',
          details: error.message || error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async startResumeBotLoop(action: ActionTypes) {
    const resumes = await this.resumeRepository.find({
      where: { status: ResumeStatus.ACTIVE },
      relations: { user: true },
    });

    for (const { id } of resumes) {
      await this.startResumeBot(id, action);
    }
  }

  public async generateCv(uid: string, resumeId: number) {
    return 'hello';
  }

  public async getOneResumeByIdWithSpecialization(
    resumeId: number,
    selectedSpecialty: string,
  ): Promise<Resume | null> {
    try {
      const resume = await this.resumeRepository.findOne({
        where: {
          id: resumeId,
          specialty: ILike(`%${selectedSpecialty}%`),
        },
        select: {
          user: {
            firstName: true,
            lastName: true,
            address: true,
            phoneNumber: true,
            email: true,
          },
        },
        relations: {
          user: true,
        },
      });
      return resume;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }
}
