export type HttpCheckResult = {
  statusCode: number | null;
  responseMs: number | null;
  error: string | null;
};

export const CHECK_TIMEOUT_MS = 10_000;

export async function performHttpCheck(
  url: string,
  options?: {
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
  },
): Promise<HttpCheckResult> {
  const fetchImpl = options?.fetchImpl ?? fetch;
  const timeoutMs = options?.timeoutMs ?? CHECK_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  try {
    const response = await fetchImpl(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
    });
    return {
      statusCode: response.status,
      responseMs: Date.now() - started,
      error: null,
    };
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "timeout"
        : error instanceof Error
          ? error.message
          : "network_error";
    return {
      statusCode: null,
      responseMs: null,
      error: message,
    };
  } finally {
    clearTimeout(timer);
  }
}
