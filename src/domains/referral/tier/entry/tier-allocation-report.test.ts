import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTierAllocationReport } from "./tier-allocation-report.js";
import { TierAllocation, newTierAllocation } from "./tier-allocation.js";

test("TierAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_824_784);
  const items: TierAllocation[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newTierAllocation(`tier-allocation-${index}`, "sample"));
  }
  const report = buildTierAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
