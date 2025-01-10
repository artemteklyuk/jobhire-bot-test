export enum BotAuthErrors {
  NOT_NEED_AUTH = 'Not need auth',
  NOT_FOUND_BOT_REGISTERED_ACCOUNT = 'Not found bot registered account',
  NOT_FOUND_BOT_AUTH_PROVIDER = 'Not found bot auth provider',
  ALREADY_TRIED_BOT_AUTHENTICATED_WITH_STATUS_FAILED = 'Already tried authenticated with status failed',
  ALREADY_BOT_AUTHENTICATED = 'Already authenticated',
  FAILED_AUTHENTICATION = 'Failed authentication',
  FAILED_AUTHENTICATION_BY_COOKIE = 'Failed authentication by cookie',
}

export class NotNeedAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = BotAuthErrors.NOT_NEED_AUTH;
  }
}

export class NotFoundBotRegisteredAccountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = BotAuthErrors.NOT_FOUND_BOT_REGISTERED_ACCOUNT;
  }
}

export class NotFoundBotAuthProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = BotAuthErrors.NOT_FOUND_BOT_AUTH_PROVIDER;
  }
}

export class AlreadyTriedBotAuthenticatedWithStatusFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = BotAuthErrors.ALREADY_TRIED_BOT_AUTHENTICATED_WITH_STATUS_FAILED;
  }
}

export class AlreadyBotAuthenticatedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = BotAuthErrors.ALREADY_BOT_AUTHENTICATED;
  }
}

export class FailedAuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = BotAuthErrors.FAILED_AUTHENTICATION;
  }
}

export class FailedAuthenticationByCookieError extends Error {
  constructor(message: string) {
    super(message);
    this.name = BotAuthErrors.FAILED_AUTHENTICATION_BY_COOKIE;
  }
}
