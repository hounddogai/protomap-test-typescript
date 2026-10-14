import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedModelGroupReport } from "./batched-model-group-report.js";
import { BatchedModelGroup, newBatchedModelGroup } from "./batched-model-group.js";

test("BatchedModelGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_954_349);
  const items: BatchedModelGroup[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBatchedModelGroup(`batched-model-group-${index}`, "sample"));
  }
  const report = buildBatchedModelGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
