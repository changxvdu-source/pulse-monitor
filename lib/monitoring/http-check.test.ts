import { describe, expect, it, vi } from "vitest";
import { performHttpCheck } from "./http-check";

describe("performHttpCheck", () => {
  it("does not follow redirects and returns the first status code", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(null, { status: 301 });
    }) as unknown as typeof fetch;

    const result = await performHttpCheck("https://example.com", { fetchImpl });
    expect(result.statusCode).toBe(301);
    expect(result.error).toBeNull();
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({ redirect: "manual", method: "GET" }),
    );
  });

  it("returns timeout when the request is aborted", async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        });
      });
    }) as unknown as typeof fetch;

    const result = await performHttpCheck("https://example.com", {
      fetchImpl,
      timeoutMs: 20,
    });
    expect(result.error).toBe("timeout");
    expect(result.statusCode).toBeNull();
  });
});
