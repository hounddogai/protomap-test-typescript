import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSuppressionAllocationReport } from "./suppression-allocation-report.js";
import { SuppressionAllocation, newSuppressionAllocation } from "./suppression-allocation.js";

test("SuppressionAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_569_508);
  const items: SuppressionAllocation[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSuppressionAllocation(`suppression-allocation-${index}`, "sample"));
  }
  const report = buildSuppressionAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
