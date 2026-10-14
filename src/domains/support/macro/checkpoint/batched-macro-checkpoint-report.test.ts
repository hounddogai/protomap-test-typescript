import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedMacroCheckpointReport } from "./batched-macro-checkpoint-report.js";
import { BatchedMacroCheckpoint, newBatchedMacroCheckpoint } from "./batched-macro-checkpoint.js";

test("BatchedMacroCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_466_859);
  const items: BatchedMacroCheckpoint[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedMacroCheckpoint(`batched-macro-checkpoint-${index}`, "sample"));
  }
  const report = buildBatchedMacroCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
