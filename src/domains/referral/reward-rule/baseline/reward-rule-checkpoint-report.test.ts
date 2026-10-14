import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardRuleCheckpointReport } from "./reward-rule-checkpoint-report.js";
import { RewardRuleCheckpoint, newRewardRuleCheckpoint } from "./reward-rule-checkpoint.js";

test("RewardRuleCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_394_830);
  const items: RewardRuleCheckpoint[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRewardRuleCheckpoint(`reward-rule-checkpoint-${index}`, "sample"));
  }
  const report = buildRewardRuleCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
