import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedRewardRulePolicyReport } from "./batched-reward-rule-policy-report.js";
import { BatchedRewardRulePolicy, newBatchedRewardRulePolicy } from "./batched-reward-rule-policy.js";

test("BatchedRewardRulePolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_511_481);
  const items: BatchedRewardRulePolicy[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBatchedRewardRulePolicy(`batched-reward-rule-policy-${index}`, "sample"));
  }
  const report = buildBatchedRewardRulePolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
