import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredSuppressionAllocationReport } from "./tiered-suppression-allocation-report.js";
import { TieredSuppressionAllocation, newTieredSuppressionAllocation } from "./tiered-suppression-allocation.js";

test("TieredSuppressionAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_025_553);
  const items: TieredSuppressionAllocation[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTieredSuppressionAllocation(`tiered-suppression-allocation-${index}`, "sample"));
  }
  const report = buildTieredSuppressionAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
