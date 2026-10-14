import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardThresholdReport } from "./reward-threshold-report.js";
import { RewardThreshold, newRewardThreshold } from "./reward-threshold.js";

test("RewardThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_576_748);
  const items: RewardThreshold[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRewardThreshold(`reward-threshold-${index}`, "sample"));
  }
  const report = buildRewardThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
