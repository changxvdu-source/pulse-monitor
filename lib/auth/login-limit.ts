export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_MAX_FAILURES = 5;

const failuresByIp = new Map<string, number[]>();

export function clientIp(headerList: {
  get(name: string): string | null | undefined;
}): string {
  const forwarded = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  const real = headerList.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}

export function isThrottled(ip: string, now = Date.now()): boolean {
  return recentFailures(ip, now).length >= LOGIN_MAX_FAILURES;
}

export function recordFailure(ip: string, now = Date.now()): void {
  const next = [...recentFailures(ip, now), now];
  failuresByIp.set(ip, next);
}

export function recordSuccess(ip: string): void {
  failuresByIp.delete(ip);
}

export function resetLoginLimitForTests(): void {
  failuresByIp.clear();
}

function recentFailures(ip: string, now: number): number[] {
  const cutoff = now - LOGIN_WINDOW_MS;
  return (failuresByIp.get(ip) ?? []).filter((at) => at > cutoff);
}
