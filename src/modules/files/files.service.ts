import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import * as uuid from 'uuid';

@Injectable()
export class FilesService {
  private async ensureDirectoryExists(directoryPath: string): Promise<void> {
    try {
      await fs.mkdir(directoryPath, {
        recursive: true,
      });
    } catch (error) {
      throw error;
    }
  }

  async createFileFromBuffer(file: Buffer, extension: string): Promise<string> {
    try {
      const fileName = uuid.v4() + `.${extension}`;
      const filePath = path.resolve(__dirname, '..', '..', '..', '..', '..', '..', '..', '..', 'static');

      await this.ensureDirectoryExists(filePath);

      await fs.writeFile(path.join(filePath, fileName), file);

      return fileName;
    } catch (error: unknown) {
      throw new HttpException('Проблемы с записью файла', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createFile(file: any): Promise<string> {
    try {
      const fileExtension = file.originalname.split('.').pop();

      const fileName = uuid.v4() + `.${fileExtension}`;
      const filePath = path.resolve(__dirname, '..', '..', '..', '..', '..', '..', '..', '..', 'static');

      await this.ensureDirectoryExists(filePath);

      await fs.writeFile(path.join(filePath, fileName), file.buffer);

      return fileName;
    } catch (error: unknown) {
      throw new HttpException('Проблемы с записью файла', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
