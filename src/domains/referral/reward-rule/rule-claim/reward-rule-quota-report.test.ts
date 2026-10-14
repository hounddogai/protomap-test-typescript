import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardRuleQuotaReport } from "./reward-rule-quota-report.js";
import { RewardRuleQuota, newRewardRuleQuota } from "./reward-rule-quota.js";

test("RewardRuleQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_673_072);
  const items: RewardRuleQuota[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRewardRuleQuota(`reward-rule-quota-${index}`, "sample"));
  }
  const report = buildRewardRuleQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
