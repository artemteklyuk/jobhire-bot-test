const ONE_DAY = 24 * 60 * 60 * 1000;

export enum Durations {
  SECOND = 1000,
  MINUTE = 60 * 1000,
  HOUR = 60 * 60 * 1000,
  DAY = ONE_DAY,
  WEEK = 7 * ONE_DAY,
  MONTH = 30 * ONE_DAY,
  YEAR = 365 * ONE_DAY,
}
