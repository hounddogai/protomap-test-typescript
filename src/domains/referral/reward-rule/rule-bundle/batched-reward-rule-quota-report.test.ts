import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedRewardRuleQuotaReport } from "./batched-reward-rule-quota-report.js";
import { BatchedRewardRuleQuota, newBatchedRewardRuleQuota } from "./batched-reward-rule-quota.js";

test("BatchedRewardRuleQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_395_439);
  const items: BatchedRewardRuleQuota[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedRewardRuleQuota(`batched-reward-rule-quota-${index}`, "sample"));
  }
  const report = buildBatchedRewardRuleQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
