import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardAllocationReport } from "./reward-allocation-report.js";
import { RewardAllocation, newRewardAllocation } from "./reward-allocation.js";

test("RewardAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_747_680);
  const items: RewardAllocation[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRewardAllocation(`reward-allocation-${index}`, "sample"));
  }
  const report = buildRewardAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
