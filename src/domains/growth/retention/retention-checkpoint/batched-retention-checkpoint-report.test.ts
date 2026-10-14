import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedRetentionCheckpointReport } from "./batched-retention-checkpoint-report.js";
import { BatchedRetentionCheckpoint, newBatchedRetentionCheckpoint } from "./batched-retention-checkpoint.js";

test("BatchedRetentionCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_512_303);
  const items: BatchedRetentionCheckpoint[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBatchedRetentionCheckpoint(`batched-retention-checkpoint-${index}`, "sample"));
  }
  const report = buildBatchedRetentionCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
