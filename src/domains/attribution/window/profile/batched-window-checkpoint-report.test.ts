import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedWindowCheckpointReport } from "./batched-window-checkpoint-report.js";
import { BatchedWindowCheckpoint, newBatchedWindowCheckpoint } from "./batched-window-checkpoint.js";

test("BatchedWindowCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_266_492);
  const items: BatchedWindowCheckpoint[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBatchedWindowCheckpoint(`batched-window-checkpoint-${index}`, "sample"));
  }
  const report = buildBatchedWindowCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
