import { AxiosError } from "axios";

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly responseData: unknown;
  public readonly code?: string;

  constructor(message: string, statusCode: number, responseData?: unknown, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.responseData = responseData;
    this.code = code;
  }
}

function getNetworkErrorType(error: AxiosError): string {
  if (error.code === 'ECONNABORTED') return 'Request Timeout';
  if (error.code === 'ERR_NETWORK') return 'Network Error';
  if (error.code === 'ECONNREFUSED') return 'Connection Refused';
  if (error.code === 'ERR_CANCELED') return 'Request Cancelled';

  if (!error.response && error.request) {
    const xhr = error.request as XMLHttpRequest | undefined;
    if (xhr && xhr.status === 0 && xhr.readyState === 0) {
      return 'CORS Error — backend not reachable from this origin';
    }
    if (xhr && xhr.statusText === 'error') {
      return 'CORS Error — cross-origin request blocked';
    }
    return 'Backend Offline — no response received';
  }

  return 'Network Error';
}

export function parseApiError(error: unknown): ApiError | Error {
  if (error instanceof AxiosError) {
    if (isNetworkError(error)) {
      const detail = getNetworkErrorType(error);
      return new ApiError(detail, 0, { code: error.code });
    }

    const statusCode = error.response?.status || 500;
    const data = error.response?.data as Record<string, unknown> | undefined;

    const message =
      data?.error as string ||
      (data?.error as Record<string, unknown> | undefined)?.message as string ||
      data?.message as string ||
      getHttpStatusMessage(statusCode) ||
      error.message ||
      "An error occurred while processing your request";

    const code = data?.code as string | undefined;

    return new ApiError(message, statusCode, data, code);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("An unknown error occurred");
}

function getHttpStatusMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized — please login again',
    403: 'Forbidden — you do not have permission',
    404: 'Not Found — the requested resource does not exist',
    409: 'Conflict — the request conflicts with current state',
    422: 'Validation Error — please check your input',
    429: 'Too Many Requests — please slow down',
    500: 'Internal Server Error',
    502: 'Bad Gateway — upstream service unavailable',
    503: 'Service Unavailable — backend is starting up',
    504: 'Gateway Timeout — upstream service timed out',
  };
  return messages[status] || '';
}

export function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof ApiError) return error.statusCode === 401;
  return (
    error instanceof AxiosError &&
    error.response?.status === 401
  );
}

export function isForbiddenError(error: unknown): boolean {
  if (error instanceof ApiError) return error.statusCode === 403;
  return (
    error instanceof AxiosError &&
    error.response?.status === 403
  );
}

export function isNotFoundError(error: unknown): boolean {
  if (error instanceof ApiError) return error.statusCode === 404;
  return (
    error instanceof AxiosError &&
    error.response?.status === 404
  );
}

export function isValidationError(error: unknown): boolean {
  if (error instanceof ApiError) return error.statusCode === 422;
  return (
    error instanceof AxiosError &&
    error.response?.status === 422
  );
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof ApiError) return error.statusCode === 0;
  return (
    error instanceof AxiosError &&
    !error.response &&
    !!error.request
  );
}

export function isCorsError(error: unknown): boolean {
  if (error instanceof ApiError && error.statusCode === 0) {
    return error.message.includes('CORS');
  }
  return false;
}

export function isTimeoutError(error: unknown): boolean {
  if (error instanceof ApiError && error.statusCode === 0) {
    return error.message.includes('Timeout');
  }
  return (
    error instanceof AxiosError &&
    error.code === 'ECONNABORTED'
  );
}
