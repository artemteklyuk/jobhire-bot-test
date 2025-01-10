import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PushUserToDedicatedQueueDto } from './dto/push-user-to-dedicated-queue.dto';
import { BOT_ACTIONS } from 'src/common/consts/start-bot.consts';

@ApiTags('Resume')
@Controller('resume')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Get('hard-start-all-active-resumes-parser')
  public async hardStartAllActiveResumesParser() {
    await this.resumeService.startResumeBotLoop({
      [BOT_ACTIONS.parseJobs]: true,
    });
  }

  @Get('hard-start-all-active-resumes-filler')
  public async hardStartAllActiveResumesFiller() {
    await this.resumeService.startResumeBotLoop({
      [BOT_ACTIONS.fillForm]: true,
    });
  }

  @Post('push-user-to-dedicated-queue')
  public async pushUserToDedicatedQueue(
    @Body() { uid }: PushUserToDedicatedQueueDto,
  ) {
    return await this.resumeService.startResumeBotForUser(uid, [
      {
        [BOT_ACTIONS.fillForm]: true,
      },
    ]);
  }
}
