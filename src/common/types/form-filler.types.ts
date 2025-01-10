import { IFormFillerStrategy } from './form-filler.strategy.interface';

export type FormFillerStrategiesFabric = { [host: string]: new () => IFormFillerStrategy };

type FormFillAdditionalStatus = 'VacancyExpired' | 'Ok' | null | undefined;

export type FormFillStatus = {
  isSuccessful: boolean;
  additionalStatus: FormFillAdditionalStatus | string;
};
