import { JOB_PROVIDER_NAMES } from './job-providers.consts';

export const PROXY_TEST_NAMES: {
  [x: string]: {
    parser: string;
    filler: string;
  };
} = {
  [JOB_PROVIDER_NAMES.simplyhired]: {
    parser: 'simplyhired_proxy_test_parser',
    filler: 'simplyhired_proxy_test_filler',
  },
  [JOB_PROVIDER_NAMES.indeed]: {
    parser: 'indeed_proxy_test_parser',
    filler: 'indeed_proxy_test_filler',
  },
  [JOB_PROVIDER_NAMES.workable]: {
    parser: 'workable_proxy_test_parser',
    filler: 'workable_proxy_test_filler',
  },
  [JOB_PROVIDER_NAMES.talent]: {
    parser: 'talent_proxy_test_parser',
    filler: 'talent_proxy_test_filler',
  },
};
