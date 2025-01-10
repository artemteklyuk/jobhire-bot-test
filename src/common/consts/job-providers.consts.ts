import { JobProvider } from "src/modules/workable-parser/connect.service";

export const JOB_PROVIDER_NAMES = {
  talent: 'talent',
  simplyhired: 'simplyhired',
  indeed: 'indeed',
  workable: 'workable',
  glassdoor: 'glassdoor',
  greenhouse: 'greenhouse',
  level: 'level',
};

// Если добавляем нового провайдера, ОБЯЗАТЕЛЬНО необходимо перераспределить веса
export const JOB_PROVIDERS: { [provider: string]: JobProvider } = {
  [JOB_PROVIDER_NAMES.talent]: {
    mainHost: 'www.talent.com',
    isNeededAuth: true,
    isNeededAuthForParser: false,
    nameForAuth: 'talent',
    alternative: [],
    fillerWeight: 0,
    parserWeight: 0,
  },
  [JOB_PROVIDER_NAMES.simplyhired]: {
    mainHost: 'www.simplyhired.com',
    isNeededAuth: true,
    isNeededAuthForParser: false,
    nameForAuth: 'indeed',
    alternative: [],
    matchRate: 75,
    fillerWeight: 0.3,
    parserWeight: 0.3,
    isCanAuthWithCookie: true,
  },
  [JOB_PROVIDER_NAMES.indeed]: {
    mainHost: 'www.indeed.com',
    isNeededAuth: false,
    isNeededAuthForParser: false,
    nameForAuth: 'indeed',
    alternative: ['smartapply.indeed.com', 'm5.apply.indeed.com'],
  },
  [JOB_PROVIDER_NAMES.workable]: {
    mainHost: 'jobs.workable.com',
    isNeededAuth: false,
    isNeededAuthForParser: false,
    nameForAuth: 'workable',
    alternative: [],
    fillerWeight: 0.3,
    parserWeight: 0.3,
  },
  [JOB_PROVIDER_NAMES.glassdoor]: {
    mainHost: 'www.glassdoor.com',
    isNeededAuth: true,
    isNeededAuthForParser: false,
    nameForAuth: 'glassdoor',
    alternative: [],
    fillerWeight: 0.3,
    parserWeight: 0.3,
  },
  [JOB_PROVIDER_NAMES.greenhouse]: {
    mainHost: 'job-boards.greenhouse.io',
    isNeededAuth: false,
    isNeededAuthForParser: false,
    nameForAuth: 'greenhouse',
    alternative: [],
    fillerWeight: 0.05,
    parserWeight: 0.05,
  },
  [JOB_PROVIDER_NAMES.level]: {
    mainHost: 'jobs.lever.co',
    isNeededAuth: false,
    isNeededAuthForParser: false,
    nameForAuth: 'level',
    alternative: [],
    fillerWeight: 0.05,
    parserWeight: 0.05,
  },
};

const EXCLUDED_STRATEGIES_FOR_JOB_PARSER = ['www.indeed.com'];

export function getJobsProviderNamesForParser() {
  return Object.values(JOB_PROVIDERS)
    .filter(({ mainHost }) => !EXCLUDED_STRATEGIES_FOR_JOB_PARSER.includes(mainHost))
    .map(({ mainHost }) => mainHost);
}

export function getJobsProvidersForParser() {
  const jobProvidersForParser: { [provider: string]: JobProvider } = {};

  for (const [key, value] of Object.entries(JOB_PROVIDERS)) {
    if (!EXCLUDED_STRATEGIES_FOR_JOB_PARSER.includes(value.mainHost)) {
      jobProvidersForParser[key] = value;
    }
  }

  return jobProvidersForParser;
}

const EXCLUDED_STRATEGIES_FOR_JOB_FILLER = ['www.simplyhired.com'];

export function getJobsProviderNamesForFiller() {
  return Object.values(JOB_PROVIDERS)
    .filter(({ mainHost }) => !EXCLUDED_STRATEGIES_FOR_JOB_FILLER.includes(mainHost))
    .map(({ mainHost }) => mainHost);
}

export function getCountJobsByHostForFiller(commonCount = 250) {
  const providersForParser = getJobsProvidersForParser();

  let sumOfPercents = 0;

  const providerWithoutWeight: string[] = [];

  const countJobsByHost: { [host: string]: number } = {};

  for (const host of Object.keys(providersForParser)) {
    const currentWeight = providersForParser[host]?.fillerWeight || 0;

    if (currentWeight !== 0) {
      countJobsByHost[host] = Math.ceil(commonCount * currentWeight);
      sumOfPercents += currentWeight;
    } else {
      providerWithoutWeight.push(host);
    }
  }

  for (const host of providerWithoutWeight) {
    countJobsByHost[host] = Math.ceil(((1 - sumOfPercents) / providerWithoutWeight.length) * commonCount);
  }

  return countJobsByHost;
}

export function getCountJobsByHostForParser(commonCount = 200) {
  const providersForParser = getJobsProvidersForParser();

  let sumOfPercents = 0;

  const providerWithoutWeight: string[] = [];

  const countJobsByHost: { [host: string]: number } = {};

  for (const [, value] of Object.entries(providersForParser)) {
    const currentWeight = value.parserWeight || 0;
    if (currentWeight !== 0) {
      countJobsByHost[value.mainHost] = Math.ceil(commonCount * currentWeight);
      sumOfPercents += currentWeight;
    } else {
      providerWithoutWeight.push(value.mainHost);
    }
  }

  for (const host of providerWithoutWeight) {
    countJobsByHost[host] = Math.ceil(((1 - sumOfPercents) / providerWithoutWeight.length) * commonCount);
  }

  return countJobsByHost;
}
