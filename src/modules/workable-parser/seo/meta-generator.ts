import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import * as crypto from 'node:crypto';
import { StoredVacancy } from 'src/entities';
import { getStateNameByCode } from '../transform-state';

export function capitalizeAllWords(target: string): string {
  return target
    .split(/\s+/)
    .map((part) => capitalize(part))
    .join(' ');
}

export function capitalize(target: string): string {
  return target.charAt(0).toUpperCase().concat(target.slice(1).toLowerCase());
}


type MetaTemplate = {
  template: string;
  replacers: {
    tag: string;
    count: number;
    variants: string[];
  }[];
};

type MetaFile = {
  meta: {
    title: MetaTemplate;
    description: MetaTemplate;
  }[];
};

export type DataForMeta = Pick<StoredVacancy, 'title' | 'state' | 'company' | 'appearanceDate' | 'city'>;

export type MetaTarget = 'vacancies' | 'search' | 'location-only' | 'vacancy-only' | 'search-page';

export default abstract class MetaGenerator {
  private static readonly pathToMeta = resolve(
    'src',
    'modules',
    'workable-parser',
    'seo',
    'meta'
  );
  private static readonly meta: Map<MetaTarget, MetaFile['meta']> = new Map([
    ['search', JSON.parse(readFileSync(join(this.pathToMeta, 'search-meta.json')).toString()).meta],
    ['vacancies', JSON.parse(readFileSync(join(this.pathToMeta, 'vacancies-meta.json')).toString()).meta],
    ['location-only', JSON.parse(readFileSync(join(this.pathToMeta, 'location-meta.json')).toString()).meta],
    ['vacancy-only', JSON.parse(readFileSync(join(this.pathToMeta, 'vacancy-meta.json')).toString()).meta],
    ['search-page', JSON.parse(readFileSync(join(this.pathToMeta, 'search-page-meta.json')).toString()).meta],

  ]);

  private static getRandomNumber(min: number, max: number): number {
    return crypto.randomInt(min, max);
  }

  private static generateByTemplate(
    { template, replacers }: MetaTemplate,
    { company, title, appearanceDate, state, city }: DataForMeta
  ): string {
    for (const { tag, count, variants } of replacers) {
      template = template.replace(`{${tag}}`, variants[this.getRandomNumber(0, count)]);
    }

    const stateFull = state ? getStateNameByCode(state) || 'USA' : 'USA';

    return template
      .replace(/\{title\}/g, title)
      .replace(/\{state\}/g, capitalizeAllWords(stateFull))
      .replace(/\{company\}/g, company)
      .replace(/\{date\}/g, appearanceDate.toDateString())
      .replace(/\{location\}/g, capitalizeAllWords([city, stateFull].filter((value) => !!value).join(', ')));
  }

  public static getRandomMeta(
    data: DataForMeta,
    target: MetaTarget
  ): {
    title: string;
    description: string;
  } {
    const meta = this.meta.get(target);
    if (!meta) {
      throw new Error(`Meta ${target} not found`);
    }

    const count = meta.length;
    const { title: titleTemplate, description: descriptionTemplate } = meta[this.getRandomNumber(0, count)];

    return {
      title: this.generateByTemplate(titleTemplate, data),
      description: this.generateByTemplate(descriptionTemplate, data),
    };
  }
}
