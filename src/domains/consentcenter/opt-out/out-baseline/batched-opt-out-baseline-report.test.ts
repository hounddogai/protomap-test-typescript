import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedOptOutBaselineReport } from "./batched-opt-out-baseline-report.js";
import { BatchedOptOutBaseline, newBatchedOptOutBaseline } from "./batched-opt-out-baseline.js";

test("BatchedOptOutBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_542_633);
  const items: BatchedOptOutBaseline[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedOptOutBaseline(`batched-opt-out-baseline-${index}`, "sample"));
  }
  const report = buildBatchedOptOutBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
