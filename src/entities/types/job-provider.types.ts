export type NamesForAuth = 'talent' | 'indeed' | 'workable' | 'glassdoor' | 'greenhouse';

export type JobProvider = {
  mainHost: string;
  alternative: string[];
  isNeededAuth: boolean;
  isNeededAuthForParser: boolean;
  nameForAuth: NamesForAuth;
  matchRate?: number;
  parserWeight?: number;
  fillerWeight?: number;
  isCanAuthWithCookie?: boolean;
};
