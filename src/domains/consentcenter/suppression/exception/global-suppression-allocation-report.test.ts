import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalSuppressionAllocationReport } from "./global-suppression-allocation-report.js";
import { GlobalSuppressionAllocation, newGlobalSuppressionAllocation } from "./global-suppression-allocation.js";

test("GlobalSuppressionAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_474_398);
  const items: GlobalSuppressionAllocation[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newGlobalSuppressionAllocation(`global-suppression-allocation-${index}`, "sample"));
  }
  const report = buildGlobalSuppressionAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
