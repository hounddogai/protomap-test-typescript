import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingRewardRuleEstimateReport } from "./pending-reward-rule-estimate-report.js";
import { PendingRewardRuleEstimate, newPendingRewardRuleEstimate } from "./pending-reward-rule-estimate.js";

test("PendingRewardRuleEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_999_940);
  const items: PendingRewardRuleEstimate[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPendingRewardRuleEstimate(`pending-reward-rule-estimate-${index}`, "sample"));
  }
  const report = buildPendingRewardRuleEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
