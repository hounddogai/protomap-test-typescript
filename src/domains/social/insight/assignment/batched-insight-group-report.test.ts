import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedInsightGroupReport } from "./batched-insight-group-report.js";
import { BatchedInsightGroup, newBatchedInsightGroup } from "./batched-insight-group.js";

test("BatchedInsightGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_517_335);
  const items: BatchedInsightGroup[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedInsightGroup(`batched-insight-group-${index}`, "sample"));
  }
  const report = buildBatchedInsightGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
