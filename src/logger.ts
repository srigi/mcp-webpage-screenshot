import winston, { Logger, LoggerOptions } from 'winston';

let loggerInstance: Logger | undefined;

export function createLogger(options: LoggerOptions) {
  loggerInstance = winston.createLogger(options);

  return loggerInstance;
}

export function getLogger() {
  if (loggerInstance == null) {
    throw new Error('Logger has not been configured!');
  }

  return loggerInstance;
}
