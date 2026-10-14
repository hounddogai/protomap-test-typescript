import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardRuleTargetReport } from "./reward-rule-target-report.js";
import { RewardRuleTarget, newRewardRuleTarget } from "./reward-rule-target.js";

test("RewardRuleTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_761_823);
  const items: RewardRuleTarget[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRewardRuleTarget(`reward-rule-target-${index}`, "sample"));
  }
  const report = buildRewardRuleTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
