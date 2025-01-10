import { Controller, Get, Injectable } from '@nestjs/common';

import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Like, Not, Repository } from 'typeorm';
import * as path from 'path';
import { readFile, writeFile } from 'fs/promises';
import { PageMeta, StoredVacancy, StoredVacancyInterface } from 'src/entities';
import axios from 'axios';
import { Readable } from 'stream';
import SlugWorker from './slugs';
import { getStateNameByCode } from './transform-state';
import MetaGenerator, { capitalizeAllWords } from './seo/meta-generator';

export const COUNT_JOBS_ON_PAGE = 30;
const REGEX = '^(?:[0-9]+)?$';

export type JobProvider = {
  mainHost: string;
  alternative: string[];
  isNeededAuth: boolean;
  isNeededAuthForParser: boolean;
  nameForAuth: any;
  matchRate?: number;
  parserWeight?: number;
  fillerWeight?: number;
  isCanAuthWithCookie?: boolean;
};

dayjs.extend(utc);

@Injectable()
export class ConnectService {
  constructor(
    // @InjectRepository(User) private readonly userRepository: Repository<User>,
    // @InjectRepository(Resume)
    @InjectRepository(PageMeta)
    private readonly pageMetaRepository: Repository<PageMeta>,
    @InjectRepository(StoredVacancy)
    private readonly storedVacancyRepository: Repository<StoredVacancy>,

    // private readonly resumeRepository: Repository<Resume>,
  ) {}

  private generateSearchQuery({
    title,
    state,
  }: Partial<Pick<StoredVacancyInterface, 'title' | 'state'>>): string {
    console.log(this.wrapState(state));
    return this.wrapState(state).concat(
      state && title ? `/${SlugWorker.wrapString(title)}` : '',
    );
  }

  private wrapState(state?: string): string {
    return SlugWorker.wrapString(
      state ? getStateNameByCode(state) || 'USA' : 'USA',
    );
  }

  private splitToPieces<T>(target: T[], pieceSize: number): T[][] {
    const result: T[][] = [];
    const resultSize = Math.ceil(target.length / pieceSize);

    let temp: T[] = [],
      counter = 0,
      cycles = 0;

    target.forEach((item) => {
      if (counter < pieceSize) {
        temp.push(item);
        counter++;
      } else {
        result.push(temp);
        temp = [item];
        counter = 1;
        cycles++;
      }
    });

    if (temp && cycles < resultSize) {
      result.push(temp);
    }

    return result;
  }
  public async getHello() {
    const PATH_BY_PAGE_NUMBER_REGEX = '^(?:[0-9]+)?$';
    const COUNT_JOBS_ON_PAGE = 30;
    const countAllPagesWithJobs = Math.ceil(
      (await this.storedVacancyRepository.count()) / COUNT_JOBS_ON_PAGE,
    );
    const vacancyPages = new Map();

    const countExistPagesWithJobs = await this.pageMetaRepository
      .createQueryBuilder('page_meta')
      .where('path ~ :regex', { regex: PATH_BY_PAGE_NUMBER_REGEX })
      .getCount();

    console.log(countExistPagesWithJobs);
    console.log(countAllPagesWithJobs);
    for (
      let page = countExistPagesWithJobs + 1;
      page <= countAllPagesWithJobs;
      page++
    ) {
      const queryPart = page !== 1 ? String(page) : '';
      vacancyPages.set(queryPart, {
        appearanceDate: new Date(),
        city: '',
        company: '',
        state: '',
        title: String(page),
        ignoreTitle: true,
        metaType: 'search-page',
      });
    }
    const heap: Partial<PageMeta>[] = [];

    for (const [path, data] of vacancyPages.entries()) {
      const { description: metaDescription, title: metaTitle } =
        MetaGenerator.getRandomMeta(data, data.metaType);

      heap.push({
        path,
        metaDescription,
        metaTitle,
        extra: {
          title: !data.ignoreTitle && path !== 'usa' ? data.title : '',
          state:
            data.state !== 'USA'
              ? capitalizeAllWords(getStateNameByCode(data.state) || '')
              : '',
        },
      });
    }

    for (const batch of this.splitToPieces<Partial<PageMeta>>(heap, 1500)) {
    }

    // const countAllPagesWithJobs = Math.ceil(
    //   (await this.storedVacancyRepository.count()) / COUNT_JOBS_ON_PAGE,
    // );

    // const vacancyPages = new Map();

    // console.log(countAllMetaPages);
    // console.log(countAllPagesWithJobs);

    // for (let page = countAllMetaPages + 1; page <= 12; page++) {
    //   const queryPart = page !== 1 ? `${String(page)}` : '';
    //   if (!vacancyPages.has(queryPart) && queryPart !== 'undefined') {
    //     vacancyPages.set(queryPart, {
    //       appearanceDate: new Date(),
    //       city: '',
    //       company: '',
    //       state: '',
    //       title: String(page),
    //       ignoreTitle: true,
    //       metaType: 'search-page',
    //     });
    //   }
    // }
    // console.log(vacancyPages);
    // const heap: Partial<PageMeta>[] = [];
    // for (const [path, data] of vacancyPages.entries()) {
    //   const { description: metaDescription, title: metaTitle } =
    //     MetaGenerator.getRandomMeta(data, data.metaType);

    //   heap.push({
    //     path,
    //     metaDescription,
    //     metaTitle,
    //     extra: {
    //       title: !data.ignoreTitle && path !== 'usa' ? data.title : '',
    //       state:
    //         data.state !== 'USA'
    //           ? capitalizeAllWords(getStateNameByCode(data.state) || '')
    //           : '',
    //     },
    //   });
    // }
    // console.log(heap);

    // const batch = [
    //   {
    //     title: '',
    //     externalId: '1',
    //     encoded: { encodedState: '', encodedTitle: '' },
    //   },
    //   {
    //     title: '',
    //     externalId: '2',
    //     encoded: { encodedState: '', encodedTitle: '' },
    //   },
    //   {
    //     title: '',
    //     externalId: '3',
    //     encoded: { encodedState: '', encodedTitle: '' },
    //   },
    // ];
    // try {
    //   const newExternalIds = batch.map((item) => {
    //     return item.externalId;
    //   });

    //   const newEncoded = batch.map((item) => {
    //     return {
    //       encodedState: item.encoded?.encodedState,
    //       encodedTitle: item.encoded?.encodedTitle,
    //     };
    //   });

    //   const existsByExternalId = await this.storedVacancyRepository.find({
    //     where: {
    //       externalId: In(newExternalIds),
    //       encoded: Not(newEncoded),
    //     },
    //   });
    //   console.log('BEFORE UPSERT', existsByExternalId);
    //   console.log('BEFORE UPSERT LENGTH', existsByExternalId.length);
    //   if (existsByExternalId.length) {
    //     const metaPathsForDelete = existsByExternalId.map(
    //       (vacancy) =>
    //         `${vacancy.encoded.encodedState}/${vacancy.encoded.encodedTitle}`,
    //     );
    //   }
  }
  catch(error) {
    console.log(error);
  }
  //   const urls = await readFile(path.resolve(__dirname, 'bad.json'));
  //   const json = JSON.parse(urls.toString());
  //   const jobsResult = [];
  //   const vacanciesResult = [];

  //   json.map((item) => {
  //     const url = item['URL'];
  //     if (url.split('jobs/')[1]) {
  //       jobsResult.push(url.split('jobs/')[1]);
  //       return;
  //     }
  //     vacanciesResult.push(url.split('vacancy/')[1]);
  //     return;
  //   });
  //   console.log(jobsResult.length);
  //   console.log(vacanciesResult.length);

  // let counter = [];
  // let count = 0;
  // for (const job of jobsResult) {
  //   const res = await this.pageMetadataRepository.findOne({
  //     where: {
  //       path: job,
  //     },
  //   });

  //   count++;
  //   console.log(count);

  // if (res) {
  //   const isDeleted = await this.pageMetadataRepository.delete({
  //     path: res.path,
  //   });
  //   console.log('DELETE');
  //   counter.push(res[0]);
  // }
  // }

  // console.log(counter);

  //   const allPageCount = Math.ceil(
  //     (await this.storedVacancyRepository.count()) / 30,
  //   );

  //   const results = await this.pageMetadataRepository.count({
  //     where: {
  //       path: In(
  //         Array.apply(null, )
  //           .map(Number.call, String)
  //           .slice(1),
  //       ),
  //     },
  //   });

  //   console.log(results);
  // }
  // }
}
