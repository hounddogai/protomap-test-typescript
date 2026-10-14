import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalPaywallAllocationReport } from "./seasonal-paywall-allocation-report.js";
import { SeasonalPaywallAllocation, newSeasonalPaywallAllocation } from "./seasonal-paywall-allocation.js";

test("SeasonalPaywallAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_935_086);
  const items: SeasonalPaywallAllocation[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSeasonalPaywallAllocation(`seasonal-paywall-allocation-${index}`, "sample"));
  }
  const report = buildSeasonalPaywallAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
