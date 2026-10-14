import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingPacingBatchReport } from "./rolling-pacing-batch-report.js";
import { RollingPacingBatch, newRollingPacingBatch } from "./rolling-pacing-batch.js";

test("RollingPacingBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_918_014);
  const items: RollingPacingBatch[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRollingPacingBatch(`rolling-pacing-batch-${index}`, "sample"));
  }
  const report = buildRollingPacingBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
