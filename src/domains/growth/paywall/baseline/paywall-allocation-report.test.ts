import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPaywallAllocationReport } from "./paywall-allocation-report.js";
import { PaywallAllocation, newPaywallAllocation } from "./paywall-allocation.js";

test("PaywallAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_278_397);
  const items: PaywallAllocation[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPaywallAllocation(`paywall-allocation-${index}`, "sample"));
  }
  const report = buildPaywallAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
