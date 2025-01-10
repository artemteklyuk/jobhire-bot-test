import { ElementHandle } from 'playwright';

export type KnownInput = {
  input: ElementHandle<Element>;
  title: string | null;
  isOptional: boolean;
  type: 'text' | 'fieldset' | 'checkbox' | 'radio' | 'select';
  variants?: { variant: string; selector: string }[];
  height?: number;
  attributes?: {
    [key: string]: string | null;
  } | null;
};

export type LevelInputWrapper = {
  title: string | null;
  isOptional: boolean;
  type: 'text' | 'fieldset' | 'checkbox' | 'radio' | 'select';
  height?: number;
  cid: string;
};

export type TruncatedKnownInput = Pick<KnownInput, 'title' | 'variants' | 'attributes'>;

export type SolvedKnownInput<useFull = true> = (useFull extends true ? KnownInput : TruncatedKnownInput) & {
  answer: string | null;
};
