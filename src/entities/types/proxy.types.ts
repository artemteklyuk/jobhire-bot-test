export type Proxy = { ip: string; port: string; username: string; password: string };

export type InnerProxyAccessLog = {
  testName: string;
  isSuccess: boolean;
};

export type InnerProxy = {
  ip: string;
  port: string;
  username: string;
  password: string;
};
