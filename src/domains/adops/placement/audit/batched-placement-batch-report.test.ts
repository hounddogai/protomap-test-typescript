import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedPlacementBatchReport } from "./batched-placement-batch-report.js";
import { BatchedPlacementBatch, newBatchedPlacementBatch } from "./batched-placement-batch.js";

test("BatchedPlacementBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_396_208);
  const items: BatchedPlacementBatch[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBatchedPlacementBatch(`batched-placement-batch-${index}`, "sample"));
  }
  const report = buildBatchedPlacementBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
