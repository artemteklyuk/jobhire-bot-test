import { EmployeeCVInfo } from './employee-cv-info.types';
import { FormFillStatus } from './form-filler.types';
import { Browser, BrowserContext, Page } from 'playwright';
import { AiFormFillerService } from '../../modules/ai-form-filler/ai-form-filler.service';

export interface IFormFillerStrategy {
  formFill(
    browser: Browser,
    context: BrowserContext,
    page: Page,
    userCV: EmployeeCVInfo,
    cvText: string,
    aiFormFiller?: AiFormFillerService,
  ): Promise<FormFillStatus>;
}
