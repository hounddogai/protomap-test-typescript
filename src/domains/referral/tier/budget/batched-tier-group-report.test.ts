import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedTierGroupReport } from "./batched-tier-group-report.js";
import { BatchedTierGroup, newBatchedTierGroup } from "./batched-tier-group.js";

test("BatchedTierGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_373_522);
  const items: BatchedTierGroup[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBatchedTierGroup(`batched-tier-group-${index}`, "sample"));
  }
  const report = buildBatchedTierGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
