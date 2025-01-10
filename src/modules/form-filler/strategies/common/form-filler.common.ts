import { EmployeeCVInfo } from '../../../../common/types/employee-cv-info.types';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const configService = new ConfigService();

class FormFillerCommon {
  private readonly logger = new Logger(FormFillerCommon.name);

  public async downloadCV(
    userCV: EmployeeCVInfo,
  ): Promise<{ resumeCVFormat: string; base64File: string }> {
    let resumeCVFormat: string;

    let cvFileUrl: string;

    if (userCV.isUseGeneratedCv && userCV.generatedCvFileUrl) {
      resumeCVFormat = userCV.generatedCvFileUrl.split('.').at(-1) as string;

      cvFileUrl = 'http://5.161.185.218:4004'.concat(
        '/',
        userCV.generatedCvFileUrl,
      );
    } else {
      resumeCVFormat = userCV.cvFileUrl.split('.').at(-1) as string;

      cvFileUrl = 'https://api.jobhire.ai'.concat('/', userCV.cvFileUrl);
    }

    const response = await axios.get(cvFileUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });

    const buffer = Buffer.from(response.data);

    const base64File = buffer.toString('base64');

    return {
      resumeCVFormat,
      base64File,
    };
  }
}

export default new FormFillerCommon();
