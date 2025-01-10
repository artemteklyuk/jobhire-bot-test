import { Injectable, Logger } from '@nestjs/common';
import { Browser, BrowserContext, Page } from 'playwright';
import { BrowserBotFillerService } from './services';
import { BrowserService } from 'src/common/browser/browser.service';
import { EmployeeCVInfo } from 'src/common/types/employee-cv-info.types';
import { BOT_ACTIONS } from 'src/common/consts/start-bot.consts';

@Injectable()
export class BrowserBotService {
  private readonly logger = new Logger(BrowserBotService.name);

  constructor(
    private readonly browserService: BrowserService,
    // private readonly browserBotParserService: BrowserBotParserService,
    private readonly browserBotFillerService: BrowserBotFillerService,
  ) {}

  public async startBot(content: EmployeeCVInfo) {
    let browser: Browser | null = null;

    let context: BrowserContext | null = null;

    let page: Page | null = null;

    const browserInstance = await this.browserService.getBrowser({
      headless: false,
    });

    if (!browserInstance) {
      this.logger.fatal('Failed to create browser instance', {
        userContent: {
          uid: content.uid,
          resumeId: content.resumeId,
          cv: content.cvFileUrl,
        },
      });
    }

    browser = browserInstance.browser;
    page = browserInstance.page;
    context = browserInstance.context;

    if (!browser || !page || !context) {
      if (browser) {
        await this.browserService.closeAllPages(browser);
      }

      this.logger.fatal('Failed to create browser or page instance', {
        userContent: {
          uid: content.uid,
          resumeId: content.resumeId,
          cv: content.cvFileUrl,
        },
      });
      return;
    }

    try {
      for (const action of Object.keys(content.action)) {
        switch (action) {
          // case BOT_ACTIONS.parseJobs:
          //   await this.browserBotParserService.startBotParser(content, browser, context, page);

          //   break;
          case BOT_ACTIONS.fillForm:
            const vacancies = [
              {
                applyUrl:
                  'https://jobs.lever.co/whoop/23becab0-e8fa-4ad9-8288-ca295c82949d',
                jobTitle: 'Test Engineer II (Continuous Improvement)',
                jobDetails:
                  "<div>At WHOOP, we're on a mission to unlock human performance. WHOOP empowers users to perform at a higher level through a deeper understanding of their bodies and daily lives.</div><div><br></div><div>As a Test Engineer II, you will work closely with design, manufacturing, and production teams to ensure the manufacturing test process is efficient, reliable, and robust. You will be responsible for identifying areas of improvement and optimizing the test process, enforcing Design for Test (DFT) principles to address manufacturing challenges. Your strong understanding of electronic systems and failure analysis will enable you to troubleshoot complex issues effectively. Additionally, familiarity with common technology used for fixture qualification, such as Gauge Repeatability and Reproducibility (GR&amp;R) and process capability indices (Cp/Cpk), is essential to continuously improve test system quality and efficiency. This role emphasizes leveraging your expertise to enhance test coverage, efficiency, and improve overall product quality within the manufacturing process.</div><div><h3>RESPONSIBILITIES:</h3><ul class='posting-requirements plain-list'><ul><li>Review and optimize existing manufacturing test processes to ensure efficiency, accuracy, and quality.</li><li>Implement best practices, standardize testing procedures, and document workflows for consistency.</li><li>Develop and maintain automated test programs and scripts to improve test coverage for existing products.</li><li>Conduct failure and data analysis, collaborating closely with cross-functional teams to identify design improvement opportunities and implement corrective actions.</li><li>Partner with Design and Manufacturing teams to identify and escalate manufacturing challenges.</li><li>Lead fixture qualification activities, including GR&amp;R and Cp/Cpk analysis.</li><li>Drive initiatives to improve test fixture cycle time, reliability, and repeatability.</li></ul></ul></div><div><h3>QUALIFICATIONS:</h3><ul class='posting-requirements plain-list'><ul><li>Bachelor’s degree in Electrical Engineering, Computer Engineering, or a related technical discipline.</li><li>2+ years of experience with test equipment, test engineering, and electronics testing.</li><li>Proficiency in programming languages such as Python, C#, C, or C++.</li><li>Familiarity with communication protocols, including UART, I2C, SPI, USB, Bluetooth, etc.</li><li>Proven experience communicating with engineering, manufacturing, and contractors in a Contract Manufacturer/Joint Design Manufacturer (CM/JDM) model, both domestically and internationally.</li><li>Background in consumer electronics or wearables is preferred but not required.</li><li>Willingness and ability to travel domestically and internationally (up to 20%).</li></ul></ul></div><div><b style='font-size: 10.5pt;'><i>This role is based in the WHOOP office located in Boston, MA. The successful candidate must be prepared to relocate if necessary to work out of the Boston, MA office.</i></b><b><i>&nbsp;</i></b></div><div><br></div><div><i style='font-size: 15px;'>Interested in the role, but don’t meet every qualification? We encourage you to still apply! At WHOOP, we believe there is much more to a candidate than what is written on paper, and we value character as much as experience. As we continue to build a diverse and inclusive environment, we encourage anyone who is interested in this role to apply.</i></div><div><br></div><div><i style='font-size: 10.5pt;'>WHOOP is an Equal Opportunity Employer and participates in </i><a rel='noopener noreferrer' class='postings-link' style='font-size: 10.5pt;' href='https://www.e-verify.gov/'><i>E-verify </i></a><i style='font-size: 10.5pt;'>to determine employment eligibility. </i><i style='font-size: 15px;'>It is unlawful in Massachusetts to require or administer a lie detector test as a condition of employment or continued employment. An employer who violates this law shall be subject to criminal penalties and civil liability.</i></div>",
                coverLetter: content.coverLetterText,
                matchRate: 90,
                host: 'jobs.lever.co',
              },
            ];

            this.logger.log(
              `Prepared ${vacancies.length} vacancies for user ${content.uid}`,
              {
                userContent: {
                  uid: content.uid,
                  resumeId: content.resumeId,
                  cv: content.cvFileUrl,
                },
              },
            );
            await this.browserBotFillerService.startBotFormFiller(
              content,
              vacancies,
              browser,
              context,
              page,
            );

            break;
          default:
            continue;
        }
      }

      await this.browserService.closeAllPages(browser);
    } catch (error) {
      await this.browserService.closeAllPages(browser);
      this.logger.error(error.message, {
        userContent: {
          uid: content.uid,
          resumeId: content.resumeId,
          cv: content.cvFileUrl,
        },
      });

      return;
    }
  }
}
