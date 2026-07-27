import type { TranslationKey } from '../../../utils/translations';

export function resolveApiErrorKey(error: unknown): TranslationKey {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  if (message.includes('NETWORK_ERROR') || message.includes('Network request failed')) {
    return 'networkError';
  }
  if (message.includes('SERVICE_UNAVAILABLE') || message.includes('503')) {
    return 'serviceUnavailable';
  }
  if (message?.startsWith('API_ERROR_')) {
    return 'approvalMessage';
  }
  if (
    message.includes('SERVER_ERROR') ||
    message.includes('500') ||
    message.includes('502') ||
    message.includes('504')
  ) {
    return 'serverError';
  }
  if (
    message.includes('429') ||
    message.includes('quota') ||
    message.includes('Quota') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message === 'QUOTA_EXCEEDED'
  ) {
    return 'quotaMessage';
  }
  if (message === 'RATE_LIMIT_EXCEEDED') {
    return 'rateLimitMessage';
  }
  return 'approvalMessage';
}

export function getErrorDisplayMessage(
  error: unknown,
  t: (key: TranslationKey | string) => string
): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  if (
    message.length > 10 &&
    !message.startsWith('Error:') &&
    !message.includes('NETWORK_ERROR') &&
    !message.startsWith('API_ERROR_') &&
    message !== 'RATE_LIMIT_EXCEEDED' &&
    message !== 'QUOTA_EXCEEDED' &&
    !message.includes('SERVICE_UNAVAILABLE') &&
    !message.includes('SERVER_ERROR')
  ) {
    const firstLine = message.split('\n')[0];
    if (firstLine.length <= 150) {
      return firstLine;
    }
  }

  return t(resolveApiErrorKey(error));
}
