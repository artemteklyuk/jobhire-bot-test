import { ValidateFunction } from 'ajv';
import OpenAI from 'openai';
import { ChatCompletionAssistantMessageParam, ChatCompletionSystemMessageParam } from 'openai/resources';

export type GptSchemaFunctionKey =
  | 'extract-cv-data'
  | 'prepare-data-for-generating-cv'
  | 'generate-cover-letter-and-match-rate'
  | 'generate-cover-letter-and-match-rate-with-changed-prompt'
  | 'fill-application-form';

export type GptFunction = {
  func: OpenAI.FunctionDefinition;
  roles: (ChatCompletionSystemMessageParam | ChatCompletionAssistantMessageParam)[];
};

export type RegisteredFunction = {
  schema: GptFunction;
  validate: ValidateFunction;
};

export type GetTypeForGPTFunction<K extends GptSchemaFunctionKey> = K extends keyof GptFunctionReturnTypeMap
  ? GptFunctionReturnTypeMap[K]
  : never;

export type GptFunctionReturnTypeMap = {
  ['extract-cv-data']: {
    firstName: string;
    lastName: string;
    gender?: string;
    email?: string;
    phone?: string;
    address?: string;
    specialty?: string;
    highestEducationLevel?: string;
    newRolePreferences: string[];
    suitableWorkLocations: string[];
    industryPreferences: string[];
    suitablePosition: string[];
    lastWorkPlace?: string;
    yearSalaryInDollars?: number;
    yearsOfService?: number;
    preferredRoles: string[];
    levelOfRoles: string[];
    isUsAuthorized?: string;
    linkedInProfileLink?: string;
    lastJobTitle?: string;
  };
  ['prepare-data-for-generating-cv']: {
    person: {
      fullName: string;
      location: string;
      email: string;
      number?: string;
      linkedin?: string;
      summary: string;
    };
    experience: {
      title: string;
      company: string;
      aboutCompany?: string;
      location?: string;
      tasks: string[];
      from: string;
      to?: string;
    }[];
    education: {
      educationalInstitution: string;
      city?: string;
      country?: string;
      degree?: string;
      specialty?: string;
      endYear?: number;
    }[];
    certificates?: {
      specialty: string;
      issuer?: string;
      year?: number;
    }[];
    skills: string[];
  };
  ['generate-cover-letter-and-match-rate']: {
    coverLetter: string;
    matchRate: number;
  };
  ['generate-cover-letter-and-match-rate-with-changed-prompt']: {
    coverLetter: string;
    matchRate: number;
  };
  ['fill-application-form']: {
    answers: {
      question: string;
      answer: string | null;
    }[];
  };
};
