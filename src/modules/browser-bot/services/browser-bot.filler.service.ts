import { Logger } from '@nestjs/common';
import { IsNull, Repository } from 'typeorm';
import { setTimeout as wait } from 'timers/promises';
import { Browser, BrowserContext, Page } from 'playwright';
import { InjectRepository } from '@nestjs/typeorm';
import { FormFillerService } from '../../form-filler/form-filler.service';
import { BotAuthErrors, NotNeedAuthError } from '../exceptions';
import { Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { AiFormFillerService } from 'src/modules/ai-form-filler/ai-form-filler.service';
import {
  EmployeeCVInfo,
  PreparedVacancy,
} from 'src/common/types/employee-cv-info.types';
import { AdminSettings, GeneratedCv, Resume, Settings } from 'src/entities';
import { VacancyStorageService } from 'src/common/vacancy-storage/vacancy-storage.service';
import { ResumeStatus } from 'src/entities/types/resume.entity.types';

const BLACKLIST_COMPANIES = ['Allstate'];
const ONE_DAY_IN_SECONDS = 86400;
const MAX_ATTEMPT_LOGIN_TASK = 2;

export class BrowserBotFillerService {
  private readonly logger = new Logger(BrowserBotFillerService.name);

  constructor(
    @InjectRepository(Resume)
    private readonly resumeRepository: Repository<Resume>,
    @InjectRepository(GeneratedCv)
    private readonly generatedCvRepository: Repository<GeneratedCv>,
    @InjectRepository(Settings)
    private readonly settingsRepository: Repository<Settings>,
    private readonly formFillerService: FormFillerService,
    private readonly aiFormFillerService: AiFormFillerService,
  ) {}

  private mergeFieldsAndQuestions(userData: EmployeeCVInfo): {
    question: string;
    answer: string[];
  }[] {
    const excludedKeys = [
      'questions',
      'cvFileUrl',
      'uid',
      'resumeId',
      'isGenerateCoverLetter',
      'isUseGeneratedCv',
      'generatedCvFileUrl',
    ];

    return Object.keys(userData)
      .filter((key) => !excludedKeys.includes(key))
      .map((key) => ({
        question: key,
        answer: [userData[key]],
      }));
  }

  private async prepareUserData(
    content: EmployeeCVInfo,
    resume: Resume,
    coverLetter: string,
  ) {
    const userSettings = await this.settingsRepository.findOne({
      where: { user: { id: resume.user.id } },
    });

    const isGenerateCoverLetter = userSettings?.isGenerateCoverLetter || false;

    const generatedCv = await this.generatedCvRepository.findOne({
      where: { id: resume.generatedCv?.id || IsNull() },
    });

    const isUseGeneratedCv =
      userSettings?.isUseGeneratedCv && generatedCv?.fileUrl ? true : false;

    return {
      ...content,
      isGenerateCoverLetter: isGenerateCoverLetter,
      isUseGeneratedCv: isUseGeneratedCv,
      ...(isUseGeneratedCv &&
        generatedCv?.fileUrl && { generatedCvFileUrl: generatedCv?.fileUrl }),
      ...(coverLetter?.length && { coverLetterText: coverLetter }),
      questions: [
        ...content.questions,
        ...this.mergeFieldsAndQuestions(content),
        {
          question: 'When can you start on a new position?',
          answer: [
            new Date(new Date().getTime() + 7 * ONE_DAY_IN_SECONDS)
              .toISOString()
              .slice(0, 10),
          ],
        },
      ],
    };
  }

  private isExcludedCompany(
    { questions }: Pick<EmployeeCVInfo, 'questions'>,
    jobTitle: string,
  ) {
    const excludedCompanies = [
      ...(questions.find((question) =>
        question.question.includes('Excluded Companies'),
      )?.answer || []),
      ...BLACKLIST_COMPANIES,
    ];

    return excludedCompanies?.find((companyTitle) =>
      companyTitle.toLowerCase().includes(jobTitle.toLowerCase()),
    );
  }

  private getUserContentWithoutQuestions(userContent: EmployeeCVInfo) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { questions: questions, ...userContentWithoutQuestions } =
      userContent;
    return Object.assign({}, userContentWithoutQuestions);
  }

  public async startBotFormFiller(
    content: EmployeeCVInfo,
    structuredVacancies: PreparedVacancy[],
    browser: Browser,
    context: BrowserContext,
    currentPage: Page,
  ) {
    try {
      this.logger.log(`send form started`, {
        userContent: this.getUserContentWithoutQuestions(content),
      });

      for (const {
        applyUrl,
        jobTitle,
        host,
        coverLetter,
      } of structuredVacancies) {
        const currentResume = await this.resumeRepository.findOne({
          where: { id: content.resumeId },
          relations: { user: true, generatedCv: true },
        });

        if (!currentResume) {
          throw new Error(`Not found resume for ${content.uid}`);
        }

        const userContent = await this.prepareUserData(
          content,
          currentResume,
          coverLetter,
        );

        this.logger.log(`Form fill - is processing`, {
          userContent: {
            uid: userContent.uid,
            resumeId: userContent.resumeId,
            cv: userContent.cvFileUrl,
            isUseGeneratedCv: userContent.isUseGeneratedCv,
            generatedCvFileUrl: userContent.generatedCvFileUrl,
          },
        });

        if (currentResume.status !== ResumeStatus.ACTIVE) {
          this.logger.log(`Resume with id ${currentResume.id} not active`, {
            userContent: this.getUserContentWithoutQuestions(userContent),
          });
          break;
        }

        if (
          this.isExcludedCompany({ questions: userContent.questions }, jobTitle)
        ) {
          this.logger.log(
            `Vacancy with jobTitle ${jobTitle} - is skipped by excluded companies`,
            {
              userContent: this.getUserContentWithoutQuestions(userContent),
            },
          );

          continue;
        }

        await currentPage.goto(applyUrl, {
          waitUntil: 'domcontentloaded',
        });

        await wait(2000);

        //! ---------- BOT AUTH SECTION START ----------

        try {
          this.logger.log(`Login to account ${host}`, {
            userContent: this.getUserContentWithoutQuestions(userContent),
          });

          throw new NotNeedAuthError(`Not need auth for host => ${host}`);
        } catch (error) {
          switch (error.name) {
            case BotAuthErrors.NOT_NEED_AUTH:
            case BotAuthErrors.ALREADY_BOT_AUTHENTICATED:
              this.logger.log(error.message, {
                userContent: this.getUserContentWithoutQuestions(userContent),
              });
              break;
            case BotAuthErrors.NOT_FOUND_BOT_AUTH_PROVIDER:
            case BotAuthErrors.NOT_FOUND_BOT_REGISTERED_ACCOUNT:
            case BotAuthErrors.ALREADY_TRIED_BOT_AUTHENTICATED_WITH_STATUS_FAILED:
              this.logger.error(error.message, {
                userContent: this.getUserContentWithoutQuestions(userContent),
              });
              continue;
            case BotAuthErrors.FAILED_AUTHENTICATION:
            case BotAuthErrors.FAILED_AUTHENTICATION_BY_COOKIE:
              this.logger.error(error.message, {
                userContent: this.getUserContentWithoutQuestions(userContent),
              });
              continue;
            default:
              this.logger.error(error.message, {
                userContent: this.getUserContentWithoutQuestions(userContent),
              });
              continue;
          }
        }

        //! ---------- BOT AUTH SECTION END ----------

        //! ---------- BOT FORM FILL SECTION START ----------

        try {
          const formActionsHandler =
            this.formFillerService.getFormFillerInstance(host);

          const cvText = currentResume.cvText || '';

          const formFillInfo = await formActionsHandler.formFill(
            browser,
            context,
            currentPage,
            userContent,
            cvText,
            this.aiFormFillerService,
          );

          if (formFillInfo.isSuccessful) {
            this.logger.log(`form fill successful`, {
              jobsProvider: host,
              userContent: this.getUserContentWithoutQuestions(userContent),
            });

            this.logger.log(`Form fill - processed`, {
              userContent: this.getUserContentWithoutQuestions(userContent),
            });

            continue;
          }

          if (formFillInfo.additionalStatus === 'VacancyExpired') {
            this.logger.log(`Form fill - processed`, {
              userContent: this.getUserContentWithoutQuestions(userContent),
            });

            continue;
          }

          this.logger.error(`Form fill not successful`, {
            jobsProvider: host,
            userContent: this.getUserContentWithoutQuestions(userContent),
          });

          this.logger.log(`Form fill - processed`, {
            userContent: this.getUserContentWithoutQuestions(userContent),
          });

          continue;
        } catch (formFillerError) {
          this.logger.error(`Troubles in form fill`, {
            formFillerError: formFillerError.message,
            userContent: this.getUserContentWithoutQuestions(userContent),
          });
          continue;
        }
      }

      this.logger.log(`Send form ended`, {
        userContent: this.getUserContentWithoutQuestions(content),
      });

      //! ---------- BOT FORM FILL SECTION END ----------
    } catch (error) {
      this.logger.error(`Error with fill form`, {
        userContent: this.getUserContentWithoutQuestions(content),
        error: { ...error, message: error.message },
      });
    }
  }
}
