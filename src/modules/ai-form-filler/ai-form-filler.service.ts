import { ChatGptService } from '../gpt/chat-gpt.service';
import { Injectable } from '@nestjs/common';
import {
  KnownInput,
  SolvedKnownInput,
  TruncatedKnownInput,
} from '../../common/types/bot-form.type';
import { TruncatedUserInfo } from '../../common/types/employee-cv-info.types';

const INFO_DELIMITER = '\n+++++\n';
const QUESTIONS_TO_IGNORE = 'cover letter';
const COUNTS_AS_EMPTY = ['', '-', 'none', 'nothing', 'null'];

@Injectable()
export class AiFormFillerService {
  constructor(private readonly chatGptService: ChatGptService) {}

  public async solveApplicationForm<useFull = true>(
    inputs: (TruncatedKnownInput | KnownInput)[],
    userData: TruncatedUserInfo,
    cv: string,
  ) {
    const userQueryPart = this.prepareUserQuery(userData, cv);
    const formQueryPart = this.prepareFormQuery(inputs);
    const query = `${userQueryPart}\n+++++\n${formQueryPart}`;

    const rawResult = await this.getDataFromAi(query);
    const result = inputs.map((input) => ({
      ...input,
      answer: input.title
        ? rawResult.get(input.title.toLowerCase()) || null
        : null,
    })) as SolvedKnownInput<useFull>[];

    return result;
  }

  private async getDataFromAi(query: string) {
    const aiResponse = await this.chatGptService.getDataForFunction({
      functionKey: 'fill-application-form',
      content: query,
    });

    return new Map(
      aiResponse.answers.map(({ question, answer }) => [
        question.toLowerCase(),
        answer
          ? COUNTS_AS_EMPTY.includes(answer.toLowerCase())
            ? null
            : answer
          : answer,
      ]),
    );
  }

  private prepareFormQuery(questions: TruncatedKnownInput[]): string {
    return questions
      .filter(
        ({ title }) =>
          title && !QUESTIONS_TO_IGNORE.includes(title.toLowerCase()),
      )
      .map(
        ({ title, variants, attributes }) =>
          `Question: ${title}\nVariants: ${variants && variants.length > 0 ? variants.map((v) => `"${v.variant}"`).join(', ') : '-'}\nPlaceholder: ${attributes?.placeholder || '-'}`,
      )
      .join(INFO_DELIMITER);
  }

  private prepareUserQuery(userData: TruncatedUserInfo, cv: string) {
    const questions = userData.questions
      .map(
        ({ question, answer }) => `${question} - ${answer?.join('; ') || '-'}`,
      )
      .join(INFO_DELIMITER);

    const accountInfo = Object.entries(userData)
      .filter(([key]) => !['questions', 'smtpEmail'].includes(key))
      .map(([key, value]) => `${key} - ${value}`)
      .join(INFO_DELIMITER);

    return `${cv}\n=====\n${[accountInfo, questions].join(INFO_DELIMITER)}`;
  }
}
