import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PageMeta, StoredVacancy } from 'src/entities';
import { ConnectService } from './connect.service';

@Module({
  imports: [TypeOrmModule.forFeature([StoredVacancy, PageMeta])],
  providers: [ConnectService],
  exports: [ConnectService],
})
export class ConnectModule {}
