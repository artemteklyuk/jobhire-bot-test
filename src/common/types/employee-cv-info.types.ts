import { BOT_ACTIONS } from '../consts/start-bot.consts';
import { Types } from 'mongoose';
import { ResumeSerial } from './resume.entity.types';

export type ActionTypes = {
  [K in keyof typeof BOT_ACTIONS]?: boolean;
};

export type EmployeeCVInfo = {
  resumeId: number;
  resumeSerial: ResumeSerial;
  specialty: string;
  cvFileUrl: string;
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  smtpEmail?: string;
  address: string;
  phoneNumber: string;
  birthDate: Date;
  questions: {
    question: string;
    answer: string[];
  }[];
  action: ActionTypes;
  matchRate: number;
  coverLetterText?: string;
  isGenerateCoverLetter?: boolean;
  isUseGeneratedCv?: boolean;
  generatedCvFileUrl?: string;
  currentLoginAttempt?: number;
};

export type TruncatedUserInfo = Omit<
  EmployeeCVInfo,
  | 'uid'
  | 'cv'
  | 'cvFileUrl'
  | 'resumeId'
  | 'generatedCvFileUrl'
  | 'matchRate'
  | 'coverLetterText'
  | 'isGenerateCoverLetter'
  | 'isUseGeneratedCv'
  | 'action'
  | 'smtpEmail'
  | 'resumeSerial'
>;

export type PreparedVacancy = {
  applyUrl: string;
  jobTitle: string;
  jobDetails: string;
  coverLetter: string;
  matchRate: number;
  host: string;
};
