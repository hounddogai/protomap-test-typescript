import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalStepBatchReport } from "./global-step-batch-report.js";
import { GlobalStepBatch, newGlobalStepBatch } from "./global-step-batch.js";

test("GlobalStepBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_925_123);
  const items: GlobalStepBatch[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newGlobalStepBatch(`global-step-batch-${index}`, "sample"));
  }
  const report = buildGlobalStepBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
