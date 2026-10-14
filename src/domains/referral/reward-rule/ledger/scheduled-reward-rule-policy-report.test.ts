import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledRewardRulePolicyReport } from "./scheduled-reward-rule-policy-report.js";
import { ScheduledRewardRulePolicy, newScheduledRewardRulePolicy } from "./scheduled-reward-rule-policy.js";

test("ScheduledRewardRulePolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_182_476);
  const items: ScheduledRewardRulePolicy[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newScheduledRewardRulePolicy(`scheduled-reward-rule-policy-${index}`, "sample"));
  }
  const report = buildScheduledRewardRulePolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
