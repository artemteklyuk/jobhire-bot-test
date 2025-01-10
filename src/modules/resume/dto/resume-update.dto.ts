import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

class ResumeUpdateAnswer {
  @ApiProperty({ example: 1, description: 'Id вопроса' })
  id: number;

  @ApiProperty({ example: ['kekw'], description: 'Ответ на вопрос' })
  answer: string[];
}

export class ResumeUpdateDto {
  @ApiProperty({ example: 1, description: 'Id резюме' })
  resumeId: number;

  @ApiProperty({ example: 'HR', description: 'Специальность', required: false })
  specialty: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  cv: any;

  @ApiProperty({
    example: [
      { id: 1, answer: ['always working'] },
      { id: 2, answer: ['always working'] },
    ],
    description: 'Ответы на квиз',
    type: ResumeUpdateAnswer,
    required: false,
  })
  @Type(() => ResumeUpdateAnswer)
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  @IsOptional()
  answers: ResumeUpdateAnswer[];
}
