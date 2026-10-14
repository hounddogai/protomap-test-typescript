import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardRuleMilestoneReport } from "./reward-rule-milestone-report.js";
import { RewardRuleMilestone, newRewardRuleMilestone } from "./reward-rule-milestone.js";

test("RewardRuleMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_690_313);
  const items: RewardRuleMilestone[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRewardRuleMilestone(`reward-rule-milestone-${index}`, "sample"));
  }
  const report = buildRewardRuleMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
