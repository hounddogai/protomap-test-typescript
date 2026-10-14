import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedStepAdjustmentReport } from "./batched-step-adjustment-report.js";
import { BatchedStepAdjustment, newBatchedStepAdjustment } from "./batched-step-adjustment.js";

test("BatchedStepAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_588_631);
  const items: BatchedStepAdjustment[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBatchedStepAdjustment(`batched-step-adjustment-${index}`, "sample"));
  }
  const report = buildBatchedStepAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
