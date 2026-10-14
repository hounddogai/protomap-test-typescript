import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedWaitBaselineReport } from "./batched-wait-baseline-report.js";
import { BatchedWaitBaseline, newBatchedWaitBaseline } from "./batched-wait-baseline.js";

test("BatchedWaitBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_352_045);
  const items: BatchedWaitBaseline[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedWaitBaseline(`batched-wait-baseline-${index}`, "sample"));
  }
  const report = buildBatchedWaitBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
