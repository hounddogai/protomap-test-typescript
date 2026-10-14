import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRedemptionAllocationReport } from "./redemption-allocation-report.js";
import { RedemptionAllocation, newRedemptionAllocation } from "./redemption-allocation.js";

test("RedemptionAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_228_335);
  const items: RedemptionAllocation[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRedemptionAllocation(`redemption-allocation-${index}`, "sample"));
  }
  const report = buildRedemptionAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
