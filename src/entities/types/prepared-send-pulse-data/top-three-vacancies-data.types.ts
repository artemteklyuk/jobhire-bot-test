import { IBasePreparedSendPulseData } from "src/entities/prepared-send-pulse-data.entity";

export type VacancyType = {
  jobTitle: string;
  jobCompanyName: string;
  jobGeo: string;
  jobSalary: string;
};

export interface ITopThreeVacancy extends IBasePreparedSendPulseData {
  isSended: boolean;
  vacancies: VacancyType[];
}
