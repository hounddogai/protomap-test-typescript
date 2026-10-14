import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedPathCycleReport } from "./batched-path-cycle-report.js";
import { BatchedPathCycle, newBatchedPathCycle } from "./batched-path-cycle.js";

test("BatchedPathCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_666_723);
  const items: BatchedPathCycle[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBatchedPathCycle(`batched-path-cycle-${index}`, "sample"));
  }
  const report = buildBatchedPathCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
