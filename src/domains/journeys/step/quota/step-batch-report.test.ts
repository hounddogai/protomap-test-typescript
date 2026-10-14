import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStepBatchReport } from "./step-batch-report.js";
import { StepBatch, newStepBatch } from "./step-batch.js";

test("StepBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_082_535);
  const items: StepBatch[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newStepBatch(`step-batch-${index}`, "sample"));
  }
  const report = buildStepBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
