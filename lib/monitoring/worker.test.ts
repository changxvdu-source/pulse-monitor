import { describe, expect, it } from "vitest";
import { skipWhileRunning } from "./worker";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
}

describe("skipWhileRunning", () => {
  it("drops a call made while the previous one is still running", async () => {
    const first = deferred();
    let started = 0;

    const tick = skipWhileRunning(async () => {
      started += 1;
      await first.promise;
    });

    const inFlight = tick();
    await tick();
    expect(started).toBe(1);

    first.resolve();
    await inFlight;
    expect(started).toBe(1);
  });

  it("runs again once the previous call has finished", async () => {
    const first = deferred();
    let started = 0;

    const tick = skipWhileRunning(async () => {
      started += 1;
      await first.promise;
    });

    const inFlight = tick();
    first.resolve();
    await inFlight;

    await tick();
    expect(started).toBe(2);
  });

  it("runs again after a call throws", async () => {
    let started = 0;

    const tick = skipWhileRunning(async () => {
      started += 1;
      throw new Error("cycle failed");
    });

    await expect(tick()).rejects.toThrow("cycle failed");
    await expect(tick()).rejects.toThrow("cycle failed");
    expect(started).toBe(2);
  });
});
