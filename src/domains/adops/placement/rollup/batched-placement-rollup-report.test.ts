import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedPlacementRollupReport } from "./batched-placement-rollup-report.js";
import { BatchedPlacementRollup, newBatchedPlacementRollup } from "./batched-placement-rollup.js";

test("BatchedPlacementRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_230_063);
  const items: BatchedPlacementRollup[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBatchedPlacementRollup(`batched-placement-rollup-${index}`, "sample"));
  }
  const report = buildBatchedPlacementRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
