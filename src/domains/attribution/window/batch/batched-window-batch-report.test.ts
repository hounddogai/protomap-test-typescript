import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedWindowBatchReport } from "./batched-window-batch-report.js";
import { BatchedWindowBatch, newBatchedWindowBatch } from "./batched-window-batch.js";

test("BatchedWindowBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_098_745);
  const items: BatchedWindowBatch[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBatchedWindowBatch(`batched-window-batch-${index}`, "sample"));
  }
  const report = buildBatchedWindowBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
