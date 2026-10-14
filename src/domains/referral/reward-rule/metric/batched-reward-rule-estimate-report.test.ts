import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedRewardRuleEstimateReport } from "./batched-reward-rule-estimate-report.js";
import { BatchedRewardRuleEstimate, newBatchedRewardRuleEstimate } from "./batched-reward-rule-estimate.js";

test("BatchedRewardRuleEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_767_400);
  const items: BatchedRewardRuleEstimate[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBatchedRewardRuleEstimate(`batched-reward-rule-estimate-${index}`, "sample"));
  }
  const report = buildBatchedRewardRuleEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
