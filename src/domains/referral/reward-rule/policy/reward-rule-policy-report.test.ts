import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardRulePolicyReport } from "./reward-rule-policy-report.js";
import { RewardRulePolicy, newRewardRulePolicy } from "./reward-rule-policy.js";

test("RewardRulePolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_377_637);
  const items: RewardRulePolicy[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRewardRulePolicy(`reward-rule-policy-${index}`, "sample"));
  }
  const report = buildRewardRulePolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
