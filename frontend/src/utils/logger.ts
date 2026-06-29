const isDevelopment = process.env.NODE_ENV === 'development';

function log(level: 'info' | 'warn' | 'error', ...args: unknown[]) {
  if (isDevelopment) {
    console[level](...args);
  }
}

export const logger = {
  info: (...args: unknown[]) => log('info', ...args),
  warn: (...args: unknown[]) => log('warn', ...args),
  error: (...args: unknown[]) => log('error', ...args),
};
