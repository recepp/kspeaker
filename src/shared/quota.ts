/**
 * Quota helpers extracted for testability (SRP).
 * Free users: 5 messages/day. Voucher holders: unlimited.
 */
export const FREE_DAILY_MESSAGE_LIMIT = 5;

export function canSendWithQuota(params: {
  hasVoucher: boolean;
  messageCount: number;
  limit?: number;
}): boolean {
  if (params.hasVoucher) return true;
  const limit = params.limit ?? FREE_DAILY_MESSAGE_LIMIT;
  return params.messageCount < limit;
}

export function nextMessageCount(current: number): number {
  return Math.max(0, current) + 1;
}
