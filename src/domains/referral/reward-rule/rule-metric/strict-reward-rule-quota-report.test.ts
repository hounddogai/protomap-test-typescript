import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictRewardRuleQuotaReport } from "./strict-reward-rule-quota-report.js";
import { StrictRewardRuleQuota, newStrictRewardRuleQuota } from "./strict-reward-rule-quota.js";

test("StrictRewardRuleQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_638_185);
  const items: StrictRewardRuleQuota[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newStrictRewardRuleQuota(`strict-reward-rule-quota-${index}`, "sample"));
  }
  const report = buildStrictRewardRuleQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
