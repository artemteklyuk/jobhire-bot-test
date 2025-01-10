import { forwardRef, Module } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { ResumeController } from './resume.controller';
import { FilesService } from '../files/files.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResumeQuestion } from 'src/entities/resume-question.entity';
import {
  Resume,
  ResumeAnswer,
  User,
  UserAnswer,
  UserQuestion,
} from 'src/entities';
import { BrowserBotModule } from '../browser-bot/browser-bot.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Resume,
      ResumeQuestion,
      ResumeAnswer,
      User,
      UserQuestion,
      UserAnswer,
    ]),
    BrowserBotModule,
  ],
  providers: [ResumeService, FilesService],
  controllers: [ResumeController],
  exports: [ResumeService],
})
export class ResumeModule {}
