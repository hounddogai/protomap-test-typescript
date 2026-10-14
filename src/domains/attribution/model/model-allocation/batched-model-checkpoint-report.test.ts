import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedModelCheckpointReport } from "./batched-model-checkpoint-report.js";
import { BatchedModelCheckpoint, newBatchedModelCheckpoint } from "./batched-model-checkpoint.js";

test("BatchedModelCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_652_684);
  const items: BatchedModelCheckpoint[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBatchedModelCheckpoint(`batched-model-checkpoint-${index}`, "sample"));
  }
  const report = buildBatchedModelCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
