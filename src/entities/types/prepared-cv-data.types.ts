export type ExtractedCv = any;

export type PreparedCvData = {
  resume: { id: number; answer: string[] }[];
  user: { id: number; answer: string[] }[];
  profile: Pick<
    ExtractedCv,
    | 'firstName'
    | 'lastName'
    | 'gender'
    | 'address'
    | 'email'
    | 'phone'
    | 'specialty'
  >;
};
