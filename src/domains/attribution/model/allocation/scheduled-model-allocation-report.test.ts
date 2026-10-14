import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledModelAllocationReport } from "./scheduled-model-allocation-report.js";
import { ScheduledModelAllocation, newScheduledModelAllocation } from "./scheduled-model-allocation.js";

test("ScheduledModelAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_650_562);
  const items: ScheduledModelAllocation[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newScheduledModelAllocation(`scheduled-model-allocation-${index}`, "sample"));
  }
  const report = buildScheduledModelAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
