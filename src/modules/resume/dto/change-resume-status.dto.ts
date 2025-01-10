import { ApiProperty } from '@nestjs/swagger';

export class ChangeResumeStatusDto {
  uid: string;

  @ApiProperty({ example: [1, 2], description: `Массив id'шников резюме для смены статуса` })
  resumeIds: number[];
}
