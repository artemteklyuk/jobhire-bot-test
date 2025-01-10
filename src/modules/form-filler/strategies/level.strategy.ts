import { randomBytes } from 'crypto';
import { Browser, BrowserContext, ElementHandle, Page } from 'playwright';
import { setTimeout as wait } from 'timers/promises';
import { IFormFillerStrategy } from '../../../common/types/form-filler.strategy.interface';
import { EmployeeCVInfo } from '../../../common/types/employee-cv-info.types';
import { FormFillStatus } from '../../../common/types/form-filler.types';
import {
  KnownInput,
  LevelInputWrapper,
  SolvedKnownInput,
} from '../../../common/types/bot-form.type';
import { AiFormFillerService } from '../../ai-form-filler/ai-form-filler.service';
import common from './common/form-filler.common';
import { Logger } from '@nestjs/common';

const selectors = {
  INPUT_WRAPPER: '.application-question', //+
  SELECT_INPUT_CONTAINER: '.application-dropdown select', //+
  TEXT_INPUT_SELECTOR: '[type="text"], [type="email"], textarea', //+
  SELECT_INPUT_OPTIONS_SELECTOR: 'option', //+
  RADIO_INPUT_OPTIONS_SELECTOR: 'input[type="radio"]', //+
  CHECKBOX_INPUT_OPTIONS_SELECTOR: 'input[type="checkbox"]', //+
  CHECKBOX_INPUT_SELECTOR: '.application-field ul',
  COVER_LETTER_INPUT: '#additional-information', //+
  CV_UPLOAD_INPUT: '#resume-upload-input', //+
  LOCATION_LABEL: '#location-input', //+
  RADIO_INPUT_WRAPPER: '[data-qa="multiple-choice"]', //+
  SUBMIT_BUTTON: '#btn-submit', //+
  CONFIRMATION: 'msg-submit-success', //+
  REQUIRED_SELECTOR: 'span.required', //+
  LABEL_SELECTOR_VARIANT: '.application-label', //+
  TEXT_SELECTOR_VARIANT: '.text', //+
};

export class LevelFillerStrategy implements IFormFillerStrategy {
  private readonly logger = new Logger(LevelFillerStrategy.name);

  private page: Page;
  private user: EmployeeCVInfo;
  private aiFormFillerService: AiFormFillerService;

  public async formFill(
    browser: Browser,
    context: BrowserContext,
    page: Page,
    userCV: EmployeeCVInfo,
    cvText: string,
    aiFormFillerService: AiFormFillerService,
  ): Promise<FormFillStatus> {
    try {
      this.init({
        page,
        user: userCV,
        aiFormFillerService,
      });

      // this.prepareSmtpEmail();

      await this.page.waitForLoadState('networkidle');

      const { base64File, resumeCVFormat } = await common.downloadCV(this.user);

      await this.uploadCv(
        Buffer.from(base64File, `base64`),
        `cv.${resumeCVFormat}`,
      );
      await this.fillCoverLetter(
        this.user.isGenerateCoverLetter
          ? this.user.coverLetterText || '-'
          : '-',
      );

      const allInputs = await this.collectAllInputs();
      const solvedInputs = await this.solveInputs(allInputs, cvText);
      await this.fillAllInputs(solvedInputs);

      await this.submit();

      await this.checkForSuccess();

      return {
        isSuccessful: true,
        additionalStatus: null,
      };
    } catch (error) {
      console.log(error);

      this.logger.error(
        {
          msg: 'Failed to fill greenhouse form',
          errorMessage: error.message,
          error,
        },
        error,
      );

      return {
        isSuccessful: false,
        additionalStatus: null,
      };
    }
  }

  private async checkForSuccess() {
    await this.page.waitForSelector(selectors.CONFIRMATION, {
      timeout: 180000,
    });
  }

  private async submit() {
    console.log('SUBMIT');
    wait(50000);
    // await this.click(selectors.SUBMIT_BUTTON, 'evaluate');
  }

  private async solveInputs(inputs: KnownInput[], cv: string) {
    return await this.aiFormFillerService.solveApplicationForm(
      inputs,
      this.user,
      cv,
    );
  }

  private async fillAllInputs(inputs: KnownInput[]) {
    for (const input of inputs) {
      this.logger.log(`Trying to fill ${input.title}`);

      const fillerFunction = this.getFillFunction(input.type);
      await fillerFunction(input);
      await wait(400);
    }
  }

  private getFillFunction(type: string) {
    let func: CallableFunction | null = null;
    switch (type) {
      case 'text':
        func = this.fillTextInput.bind(this);
        break;

      case 'select':
        func = this.fillSelectInput.bind(this);
        break;

      case 'checkbox':
      case 'radio':
        func = this.selectChoice.bind(this);
        break;
      default:
        throw new Error(`Unknown input type: ${type}`);
    }

    return func;
  }

  private async fillTextInput(input, page) {
    try {
      const answer = this.selectAnswer(input);

      if (answer === '-' && input.isOptional) {
        return;
      }

      await this.type(input.input, answer);
      if (input.title.includes('location')) {
        await wait(4000);

        let box = await input.input.boundingBox();
        await page.mouse.click(box.x + box.width / 2, box.y + box.height + 10); // вынести в отдельную функцию (клик на блоки)
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  async selectChoice(input: SolvedKnownInput<true>) {
    try {
      const selected =
        input.variants?.find(
          ({ variant: v }) => v.toLowerCase() === input.answer?.toLowerCase(),
        ) || input.variants?.[0];

      if (!selected) {
        throw new Error(`No variant to apply for`);
      }

      console.log(`Selected ${selected.variant} for apply`);

      const target = await input.input.$(selected.selector);

      if (!target) {
        throw new Error(`${selected} not found`);
      }

      await this.click(target, 'evaluate');
    } catch (error) {
      console.error({ error });
    }
  }

  private async fillSelectInput(input) {
    try {
      const element = input.input;

      const closestAnswer = this.selectAnswer(input);

      const optionsValues: string[] = await element.$$eval(
        selectors.SELECT_INPUT_OPTIONS_SELECTOR,
        (elements: HTMLOptionElement[]) =>
          elements.map((element) => element.value),
      );

      const [targetValue] = optionsValues.filter(
        (value) => value.toLowerCase() === closestAnswer,
      );
      await element.selectOption({ value: targetValue });
    } catch (error) {
      console.error(error);
    }
  }

  private selectAnswer(input: SolvedKnownInput<true>): string {
    const user = this.user;

    let answer = input.answer
      ? input.answer
      : input.variants?.at(0)?.variant || '-';
    switch (input.title || '-') {
      case 'first name':
        answer = user.firstName;
        break;
      case 'last name':
        answer = user.lastName;
        break;
      case 'email':
        answer = user.smtpEmail!;
        break;
      case 'phone':
        answer = user.phoneNumber;
        break;
    }

    return answer;
  }

  private prepareSmtpEmail() {
    if (!this.user.smtpEmail) {
      throw new Error('Level strategy requires internal email for apply'); // LEVELU Нужен?
    }

    const [username, domain] = this.user.smtpEmail.split('@');
    this.user.smtpEmail = [
      username,
      '+',
      this.user.resumeSerial.toString(),
      '@',
      domain,
    ].join('');
  }

  private async collectAllInputs() {
    const allInputs = await this.collectInputs();

    return allInputs.flat(1).sort(({ height: a }, { height: b }) => {
      if (!a) {
        return 1;
      }

      if (!b) {
        return -1;
      }

      return a > b ? 1 : -1;
    });
  }

  private async fillCoverLetter(coverLetter: string) {
    try {
      await this.type(selectors.COVER_LETTER_INPUT, coverLetter);
    } catch (error) {
      this.logger.error(error);
    }
  }

  private async uploadCv(cv: Buffer, title: string) {
    try {
      const input = (await this.reduceToAnElement(
        selectors.CV_UPLOAD_INPUT,
      )) as ElementHandle<HTMLInputElement>;

      await this.loadFile(input, {
        file: cv,
        title,
      });
    } catch (error) {
      this.logger.error(error);
    }
  }

  private async collectInputs() {
    const tag = randomBytes(16).toString('hex');

    const wrappers: (LevelInputWrapper | null)[] = await this.page.$$eval(
      selectors.INPUT_WRAPPER,
      (
        wrappers: HTMLDivElement[],
        [
          SELECT_INPUT_CONTAINER,
          REQUIRED_SELECTOR,
          TEXT_INPUT_SELECTOR,
          RADIO_INPUT_WRAPPER,
          CHECKBOX_INPUT_OPTIONS_SELECTOR,
          CHECKBOX_INPUT_SELECTOR,
          TEXT_SELECTOR_VARIANT,
          LABEL_SELECTOR_VARIANT,
          tag,
        ],
      ) => {
        return wrappers.map((wrapper, idx: number) => {
          const cid = [tag, idx.toString()].join('-');
          const targetLabels = [
            TEXT_SELECTOR_VARIANT,
            LABEL_SELECTOR_VARIANT,
          ].map(
            (query) =>
              (wrapper.querySelector(query) as HTMLDivElement | null)
                ?.innerText,
          );

          const [label] = targetLabels.filter((label) => !!label);
          const isOptional = !wrapper.querySelector(REQUIRED_SELECTOR);

          const selectInput = wrapper.querySelector(SELECT_INPUT_CONTAINER);
          if (!!selectInput && !!label) {
            selectInput.setAttribute('cid', cid);

            return {
              type: 'select',
              isOptional,
              title: label.replace('\n✱', '').replace('*', '').toLowerCase(),
              cid,
              height: selectInput.getBoundingClientRect().y,
            };
          }

          const radioInput = wrapper.querySelector(RADIO_INPUT_WRAPPER);
          if (!!radioInput && !!label) {
            radioInput.setAttribute('cid', cid);
            return {
              type: 'radio',
              isOptional,
              title: label.replace('\n✱', '').replace('*', '').toLowerCase(),
              cid,
              height: radioInput.getBoundingClientRect().y,
            };
          }

          const checkboxInput = wrapper.querySelector(CHECKBOX_INPUT_SELECTOR);
          const checkboxesContainer = checkboxInput?.querySelector(
            CHECKBOX_INPUT_OPTIONS_SELECTOR,
          );

          if (!!checkboxesContainer && !!checkboxInput && !!label) {
            checkboxInput.setAttribute('cid', cid);
            return {
              type: 'checkbox',
              isOptional,
              title: label.replace('\n✱', '').replace('*', '').toLowerCase(),
              cid,
              height: checkboxInput.getBoundingClientRect().y,
            };
          }

          const textInput = wrapper.querySelector(TEXT_INPUT_SELECTOR);
          if (!!textInput && !!label) {
            textInput.setAttribute('cid', cid);
            return {
              type: 'text',
              isOptional,
              title: label.replace('\n✱', '').replace('*', '').toLowerCase(),
              cid,
              height: textInput.getBoundingClientRect().y,
            };
          }

          return null;
        });
      },
      [
        selectors.SELECT_INPUT_CONTAINER,
        selectors.REQUIRED_SELECTOR,
        selectors.TEXT_INPUT_SELECTOR,
        selectors.RADIO_INPUT_WRAPPER,
        selectors.CHECKBOX_INPUT_OPTIONS_SELECTOR,
        selectors.CHECKBOX_INPUT_SELECTOR,
        selectors.TEXT_SELECTOR_VARIANT,
        selectors.LABEL_SELECTOR_VARIANT,
        tag,
      ],
    );
    // хз, ругается TS на сервере на тип LevelInputWrapper
    const existsInputs: any[] = wrappers.filter((input) => !!input);
    const result: KnownInput[] = [];
    for (const { cid, isOptional, title, height, type } of existsInputs) {
      try {
        const input = await this.reduceToAnElement(`[cid="${cid}"]`);
        let values: string[] | null = null;
        switch (type) {
          case 'radio': {
            values = await this.getInputValues(
              input,
              selectors.RADIO_INPUT_OPTIONS_SELECTOR,
            );
            break;
          }
          case 'checkbox': {
            const allValues = await this.getInputValues(
              input,
              selectors.CHECKBOX_INPUT_OPTIONS_SELECTOR,
            );
            values = allValues.filter(
              (value) => value.toLowerCase() !== 'custom' || 'other',
            );
            break;
          }
          case 'select': {
            values = (
              await this.getInputValues(
                input,
                selectors.SELECT_INPUT_OPTIONS_SELECTOR,
              )
            ).splice(1);
            break;
          }
          case 'text':
          default:
            break;
        }
        if (!values && type !== 'text') {
          throw new Error(`Failed to extract options from ${title}`);
        }
        const variants = values
          ? {
              variants: values.map((value) => ({
                selector: `[value="${value}"]`,
                variant: value.toLowerCase(),
              })),
            }
          : {};

        result.push({
          input,
          isOptional,
          title,
          type,
          attributes: null,
          height,
          ...variants,
        });
      } catch (error) {
        this.logger.error(error);
      }
    }
    return result;
  }

  private async getInputValues(
    element: ElementHandle<Element>,
    selector: string,
  ): Promise<string[]> {
    const values = await element.$$eval(selector, (elements) =>
      elements.map(
        (element: HTMLInputElement | HTMLOptionElement) => element.value,
      ),
    );
    return values;
  }

  private init({
    page,
    user,
    aiFormFillerService,
  }: {
    page: Page;
    user: EmployeeCVInfo;
    aiFormFillerService: AiFormFillerService;
  }) {
    this.page = page;
    this.user = user;
    this.aiFormFillerService = aiFormFillerService;
  }

  private async type(element: ElementHandle<Element> | string, text: string) {
    const target = await this.reduceToAnElement(element);
    await target.type(text);
  }

  private async click(
    element: ElementHandle<Element> | string,
    type: 'direct' | 'evaluate' = 'direct',
  ) {
    const target = await this.reduceToAnElement(element);

    switch (type) {
      case 'direct':
        await target.click();
        break;
      case 'evaluate':
        await target.evaluate((el: HTMLButtonElement) => el.click());
        break;
      default:
        throw new Error('Unknown click type');
    }
  }

  private async reduceToAnElement(element: ElementHandle<Element> | string) {
    const target =
      typeof element === 'string'
        ? ((await this.page.$(element)) as ElementHandle<Element>)
        : element;

    if (!target) {
      throw new Error('Element not found');
    }

    return target;
  }

  private async loadFile(
    element: ElementHandle<HTMLInputElement>,
    {
      file,
      title,
    }: {
      file: Buffer;
      title: string;
    },
  ) {
    const base64File = file.toString('base64');

    await this.page.evaluate(
      ({ base64File, title, input }) => {
        const blob = new Blob([
          new Uint8Array(
            atob(base64File)
              .split('')
              .map((char) => char.charCodeAt(0)),
          ),
        ]);

        const file = new File([blob], title);
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        input.files = dataTransfer.files;

        input.dispatchEvent(new Event('change', { bubbles: true }));
      },
      { base64File, title, input: element },
    );
  }
}
