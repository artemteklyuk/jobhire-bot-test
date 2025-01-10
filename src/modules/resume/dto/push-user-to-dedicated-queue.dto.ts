import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class PushUserToDedicatedQueueDto {
  @ApiProperty()
  @IsString()
  uid: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  offTheQueue?: boolean;
}
