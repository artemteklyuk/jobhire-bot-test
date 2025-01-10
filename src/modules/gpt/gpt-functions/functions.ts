import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { GptFunction, GptSchemaFunctionKey, RegisteredFunction } from './types';
import { aiFormFillSystemQuery } from './big-queries';

export abstract class GptFunctionRepository {
  public static readonly functionSchemaStorage = new Map<GptSchemaFunctionKey, RegisteredFunction>();

  public static getFunction(key: GptSchemaFunctionKey) {
    const func = this.functionSchemaStorage.get(key);
    if (!func) {
      throw new Error('Function not found');
    }

    return func;
  }

  @RegisterGptFunction('prepare-data-for-generating-cv')
  protected generateCv(): GptFunction {
    return {
      roles: [
        {
          role: 'system',
          content:
            "Don't use wildcard values for fields you can't fill in. Use a business-like style of speech and correct syntax errors in the source. Follow the instructions in the schema",
        },
      ],
      func: {
        name: 'prepareCvData',
        description: 'Cv data preparation according to schema',
        parameters: {
          type: 'object',
          properties: {
            person: {
              type: 'object',
              properties: {
                fullName: {
                  type: 'string',
                  description: "The person's full name",
                },
                location: {
                  type: 'string',
                  description: "The person's place of living",
                },
                email: {
                  type: 'string',
                  format: 'email',
                },
                number: {
                  type: 'string',
                  pattern: '^\\d{10,15}$',
                  description: "The person's phone number",
                },
                linkedin: {
                  type: 'string',
                  format: 'hostname',
                  description: "The person's LinkedIn profile link",
                },
                summary: {
                  type: 'string',
                  description:
                    "A general description of the resume holder's experience, expanded and improved as much as possible, i.e., errors corrected, inferences drawn from experience, education, and skills",
                },
              },
              required: ['fullName', 'location', 'email', 'summary'],
              additionalProperties: false,
            },
            experience: {
              type: 'array',
              description: 'All places of employment',
              items: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                    description: 'The position in which the person worked in the company',
                  },
                  company: {
                    type: 'string',
                    description: 'Company name',
                  },
                  aboutCompany: {
                    type: 'string',
                    description: 'Shortly about company',
                  },
                  location: {
                    type: 'string',
                    description: 'Location of the place of work',
                    examples: ['City, State'],
                  },
                  tasks: {
                    type: 'array',
                    description: 'The progress the person has made in the job',
                    items: {
                      type: 'string',
                    },
                  },
                  from: {
                    type: 'string',
                    description: 'Date of commencement of employment with this company',
                    format: 'date',
                  },
                  to: {
                    type: 'string',
                    description: 'End date of employment with this company',
                    format: 'date',
                  },
                },
                required: ['title', 'company', 'tasks', 'from'],
                additionalProperties: false,
              },
            },
            education: {
              type: 'array',
              description: "The person's education",
              items: {
                type: 'object',
                properties: {
                  educationalInstitution: {
                    type: 'string',
                    description: 'Name of educational institution',
                  },
                  city: {
                    type: 'string',
                    description: 'City in which the institution is located',
                  },
                  country: {
                    type: 'string',
                    description: 'Country in which the institution is located',
                  },
                  degree: {
                    type: 'string',
                    description: 'The degree that a person has obtained after this education',
                  },
                  specialty: {
                    type: 'string',
                    description: 'What profession the education was obtained in',
                  },
                  endYear: {
                    type: 'number',
                    description: 'Year of graduation',
                  },
                },
                required: ['educationalInstitution'],
                additionalProperties: false,
              },
            },
            certificates: {
              type: 'array',
              description: 'Certificates held by the person',
              items: {
                type: 'object',
                properties: {
                  specialty: {
                    type: 'string',
                    description: 'What professions does the certificate indicate',
                  },
                  issuer: {
                    type: 'string',
                    description: 'Name of the organization that issued the certificate',
                  },
                  year: {
                    type: 'number',
                    description: 'Certificate year',
                  },
                },
                required: ['specialty'],
                additionalProperties: false,
              },
            },
            skills: {
              type: 'array',
              description: 'Skills possessed by the individual',
              items: {
                type: 'string',
              },
            },
          },
          required: ['person', 'experience', 'education', 'skills'],
          additionalProperties: false,
        },
      },
    };
  }

  @RegisterGptFunction('extract-cv-data')
  protected extractCv(): GptFunction {
    return {
      roles: [
        {
          role: 'system',
          content: 'Imagine that you are answering the questions in the chart using information from the resume',
        },
      ],
      func: {
        name: 'extractCvData',
        description: 'Extracting cv data according to schema',
        parameters: {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
              description: 'What is your first name?',
            },
            lastName: {
              type: 'string',
              description: 'What is your last name?',
            },
            isUsAuthorized: {
              type: 'string',
              description: 'Are you authorized to work in the United States?',
              enum: ['yes', 'no'],
            },
            gender: {
              type: 'string',
              description: 'What is your gender?',
              enum: ['Decline to answer', 'Female', 'Male'],
            },
            address: {
              type: 'string',
              description: 'What is your address?',
            },
            email: {
              type: 'string',
              description: 'What is your email?',
              format: 'email',
            },
            phone: {
              type: 'string',
              description: 'What is your phone number?',
              pattern: '^\\d{10,15}$',
            },
            specialty: {
              type: 'string',
              description: 'What position do you want to work in?',
            },
            highestEducationLevel: {
              type: 'string',
              description: 'What is the highest level of education you have completed?',
              enum: ['Other', 'High school or equivalent', 'Associate', "Bachelor's", "Master's"],
            },
            lastWorkPlace: {
              type: 'string',
              description: 'What is the company name at your last place of employment?',
            },
            lastJobTitle: {
              type: 'string',
              description: 'What is your job title at your last place of employment?',
            },
            yearSalaryInDollars: {
              type: 'number',
              description:
                'What is your minimum expected annual salary in dollars based on your experience and desired position?',
            },
            yearsOfService: {
              type: 'number',
              description: 'How many years of experience do you have?',
            },
            industryPreferences: {
              type: 'array',
              description: 'What industries are exciting to you?',
              items: {
                type: 'string',
                enum: [
                  'Aerospace',
                  'AI & Machine Learning',
                  'Automotive & Transportation',
                  'Biotechnology',
                  'Consulting',
                  'Consumer Goods',
                  'Consumer Software',
                  'Crypto & Web3',
                  'Cybersecurity',
                  'Data & Analytics',
                  'Defense',
                  'Design',
                  'Education',
                  'Energy',
                  'Enterprise Software',
                  'Entertainment',
                  'Financial Services',
                  'Fintech',
                  'Food & Agriculture',
                  'Gaming',
                  'Government & Public Sector',
                  'Hardware',
                  'Healthcare',
                  'Industrial & Manufacturing',
                  'Legal',
                  'Quantitative Finance',
                  'Real Estate',
                  'Robotics & Automation',
                  'Social Impact',
                  'Venture Capital',
                  'VR & AR',
                ],
              },
            },
            newRolePreferences: {
              type: 'array',
              description: 'What do you value in a new role?',
              items: {
                type: 'string',
                enum: [
                  'Desktop',
                  'Impactful work',
                  'Independence & autonomy',
                  'Innovative product & tech',
                  'Mentorship & career development',
                  'Progressive leadership',
                  'Recognition & reward',
                  'Role mobility',
                  'Social responsibility & sustainability',
                  'Transparency & communication',
                  'Work-life balance',
                ],
              },
            },
            suitablePosition: {
              type: 'array',
              description: 'What kind of roles are you interested in?',
              items: {
                type: 'string',
                enum: [
                  'Accounting and Finance',
                  'Advertising and Public Relations',
                  'Aerospace and Aviation',
                  'Agriculture and Forestry',
                  'Arts and Entertainment',
                  'Automotive',
                  'Biotechnology and Pharmaceuticals',
                  'Construction and Real Estate',
                  'Consumer Goods and Retail',
                  'Education and Training',
                  'Energy and Utilities',
                  'Engineering and Manufacturing',
                  'Environmental and Green Energy',
                  'Fashion and Textiles',
                  'Food and Beverage',
                  'Government and Public Sector',
                  'Healthcare and Medical Services',
                  'Hospitality and Tourism',
                  'Human Resources and Recruitment',
                  'Information Technology and Software',
                  'Insurance',
                  'Legal Services',
                  'Logistics and Transportation',
                  'Media and Broadcasting',
                  'Mining and Metals',
                  'Non-Profit and NGO',
                  'Professional Services and Consulting',
                  'Publishing and Writing',
                  'Research and Development',
                  'Science and Technology',
                  'Sports and Recreation',
                  'Telecommunications',
                  'Trading and Import/Export',
                  'Venture Capital and Private Equity',
                  'Veterinary and Animal Care',
                ],
              },
            },
            suitableWorkLocations: {
              type: 'array',
              description: 'Where would you like to work?',
              items: {
                type: 'string',
                enum: [
                  'Remote',
                  'Alabama',
                  'Alaska',
                  'Arizona',
                  'Arkansas',
                  'California',
                  'Colorado',
                  'Connecticut',
                  'Delaware',
                  'District of Columbia',
                  'Florida',
                  'Georgia',
                  'Hawaii',
                  'Idaho',
                  'Illinois',
                  'Indiana',
                  'Iowa',
                  'Kansas',
                  'Kentucky',
                  'Louisiana',
                  'Maine',
                  'Maryland',
                  'Massachusetts',
                  'Michigan',
                  'Minnesota',
                  'Mississippi',
                  'Missouri',
                  'Montana',
                  'Nebraska',
                  'Nevada',
                  'New Hampshire',
                  'New Jersey',
                  'New Mexico',
                  'New York',
                  'North Carolina',
                  'North Dakota',
                  'Ohio',
                  'Oklahoma',
                  'Oregon',
                  'Pennsylvania',
                  'Rhode Island',
                  'South Carolina',
                  'South Dakota',
                  'Tennessee',
                  'Texas',
                  'Utah',
                  'Vermont',
                  'Virginia',
                  'Washington',
                  'West Virginia',
                  'Wisconsin',
                  'Wyoming',
                ],
              },
            },
            preferredRoles: {
              type: 'array',
              description: 'What kind of roles are you interested in?',
              items: {
                type: 'string',
                enum: [
                  'Accounting and Finance',
                  'Advertising and Public Relations',
                  'Aerospace and Aviation',
                  'Agriculture and Forestry',
                  'Arts and Entertainment',
                  'Automotive',
                  'Biotechnology and Pharmaceuticals',
                  'Construction and Real Estate',
                  'Consumer Goods and Retail',
                  'Education and Training',
                  'Energy and Utilities',
                  'Engineering and Manufacturing',
                  'Environmental and Green Energy',
                  'Fashion and Textiles',
                  'Food and Beverage',
                  'Government and Public Sector',
                  'Healthcare and Medical Services',
                  'Hospitality and Tourism',
                  'Human Resources and Recruitment',
                  'Information Technology and Software',
                  'Insurance',
                  'Legal Services',
                  'Logistics and Transportation',
                  'Media and Broadcasting',
                  'Mining and Metals',
                  'Non-Profit and NGO',
                  'Professional Services and Consulting',
                  'Publishing and Writing',
                  'Research and Development',
                  'Science and Technology',
                  'Sports and Recreation',
                  'Telecommunications',
                  'Trading and Import/Export',
                  'Venture Capital and Private Equity',
                  'Veterinary and Animal Care',
                ],
              },
            },
            levelOfRoles: {
              type: 'array',
              description: 'What level of roles are you looking for?',
              items: {
                type: 'string',
                enum: [
                  'Internship',
                  'Entry Level & New Grad',
                  'Junior (1 to 2 years)',
                  'Mid-level (3 to 4 years)',
                  'Senior (5 to 8 years)',
                  'Expert & Leadership (9+ years)',
                ],
              },
            },
            linkedInProfileLink: {
              type: 'string',
              description: 'What is the link to your LinkedIn profile?',
            },
          },
          required: [
            'firstName',
            'lastName',
            'isUsAuthorized',
            'gender',
            'address',
            'email',
            'phone',
            'specialty',
            'highestEducationLevel',
            'lastWorkPlace',
            'lastJobTitle',
            'yearSalaryInDollars',
            'yearsOfService',
            'industryPreferences',
            'newRolePreferences',
            'suitablePosition',
            'suitableWorkLocations',
            'preferredRoles',
            'levelOfRoles',
            'linkedInProfileLink',
          ],
        },
      },
    };
  }

  @RegisterGptFunction('generate-cover-letter-and-match-rate')
  protected generateMatchRateAndCoverLetter(): GptFunction {
    return {
      roles: [
        {
          role: 'system',
          content:
            "Use a business style of speech to generate an cover letter, Don't use dummies and replacers, if some information is missing, just skip that point, the main thing is to make the text adequate for submission and fully completed, without the need for additions",
        },
      ],
      func: {
        name: 'generateMatchRateAndCoverLetter',
        description: 'Calculate match rate cv to vacancy and generate cover letter for vacancy according to cv',
        parameters: {
          type: 'object',
          properties: {
            matchRate: {
              type: 'number',
              description:
                'Write in percentages from 0 to 100 how much this person, based on his or her resume, matches the request in the job posting.',
              minimum: 0,
              maximum: 100,
            },
            coverLetter: {
              type: 'string',
              description:
                'Write a cover letter for a current data vacancy. To ensure clarity and professionalism, it is important to avoid the use of placeholders and aliases in documents. Instead, use specific details relevant to the situation or position. This practice not only demonstrates attention to detail but also ensures that the information is accurate and personalized, thereby improving the overall quality of the document. If any information is missing, simply skip that section. Under no circumstances should you use placeholders or templates to fill in the gaps. This approach ensures that the document remains accurate and professional, reflecting the actual details available. Please ensure that your letter is addressed directly to the Hiring Manager. If the specific name is not available, you may use "Dear Hiring Manager" as the salutation.',
              minLength: 10,
              maxLength: 2500,
            },
          },
        },
      },
    };
  }

  @RegisterGptFunction('generate-cover-letter-and-match-rate-with-changed-prompt')
  protected generateMatchRateAndCoverLetterTest(): GptFunction {
    return {
      roles: [
        {
          role: 'system',
          content:
            "Use a business style of speech to generate an cover letter, Don't use dummies and replacers, if some information is missing, just skip that point, the main thing is to make the text adequate for submission and fully completed, without the need for additions",
        },
      ],
      func: {
        name: 'generateMatchRateAndCoverLetter',
        description: 'Calculate match rate cv to vacancy and generate cover letter for vacancy according to cv',
        parameters: {
          type: 'object',
          properties: {
            matchRate: {
              type: 'number',
              description:
                "Analyze the candidate's resume and the job description provided. Compare them based on the following criteria: (1) role title match, (2) alignment of responsibilities, (3) relevance of achievements and experience to the key tasks, and (4) education requirements. Based on these criteria, provide a match percentage between 0 and 100 that reflects how closely the candidate aligns with the job posting.",
              minimum: 0,
              maximum: 100,
            },
            coverLetter: {
              type: 'string',
              description:
                'Write a cover letter for a current data vacancy. To ensure clarity and professionalism, it is important to avoid the use of placeholders and aliases in documents. Instead, use specific details relevant to the situation or position. This practice not only demonstrates attention to detail but also ensures that the information is accurate and personalized, thereby improving the overall quality of the document. If any information is missing, simply skip that section. Under no circumstances should you use placeholders or templates to fill in the gaps. This approach ensures that the document remains accurate and professional, reflecting the actual details available. Please ensure that your letter is addressed directly to the Hiring Manager. If the specific name is not available, you may use "Dear Hiring Manager" as the salutation.',
              minLength: 10,
              maxLength: 2500,
            },
          },
        },
      },
    };
  }

  @RegisterGptFunction('fill-application-form')
  protected fillApplicationForm(): GptFunction {
    return {
      roles: [
        {
          role: 'system',
          content: aiFormFillSystemQuery,
        },
      ],
      func: {
        name: 'get_answers',
        description:
          "Answer to vacancy form question's, using user's data. Answer questions on behalf of the applicant. If there is not enough information, but it can be inferred from the available information, infer it. If a question has options and you can't decide which is the best answer, answer the one that is most neutral or relevant to the data you have.",
        parameters: {
          type: 'object',
          properties: {
            answers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: {
                    type: 'string',
                  },
                  answer: {
                    type: 'string',
                  },
                },
                required: ['question', 'answer'],
              },
            },
          },
          required: ['answers'],
        },
      },
    };
  }
}

/**
 *
 * @param key - ключ, по которому будет определяться функция
 * @description проверяет синтаксис JSON схемы, регистрирует функцию в хранилище и создает ей валидатор
 * @link https://json-schema.org/understanding-json-schema/reference
 */
export function RegisterGptFunction(key: GptSchemaFunctionKey) {
  return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<() => GptFunction>) {
    if (!descriptor.value) {
      throw new Error(`'${propertyKey}' must be a function`);
    }

    const schema = descriptor.value() as GptFunction;

    if (!schema.func.parameters) {
      throw new Error(`${propertyKey} must return function schema`);
    }

    const ajv = new Ajv();
    addFormats(ajv);

    const validate = ajv.compile(schema.func.parameters);

    GptFunctionRepository.functionSchemaStorage.set(key, {
      schema,
      validate,
    });

    return descriptor;
  };
}
