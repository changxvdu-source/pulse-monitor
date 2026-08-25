import { describe, expect, it } from "vitest";
import { historyDetailsOpen } from "./history-details-open";

describe("historyDetailsOpen", () => {
  it("opens Status Page history only when the Monitor is Down", () => {
    expect(
      historyDetailsOpen({ state: "Down", slowerThanUsual: false }),
    ).toBe(true);
    expect(
      historyDetailsOpen({ state: "Down", slowerThanUsual: true }),
    ).toBe(true);
    expect(
      historyDetailsOpen({ state: "Up", slowerThanUsual: true }),
    ).toBe(false);
    expect(
      historyDetailsOpen({ state: "Up", slowerThanUsual: false }),
    ).toBe(false);
    expect(
      historyDetailsOpen({ state: "Paused", slowerThanUsual: false }),
    ).toBe(false);
  });
});
