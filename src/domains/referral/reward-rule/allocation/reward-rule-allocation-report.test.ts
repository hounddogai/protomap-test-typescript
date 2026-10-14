import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardRuleAllocationReport } from "./reward-rule-allocation-report.js";
import { RewardRuleAllocation, newRewardRuleAllocation } from "./reward-rule-allocation.js";

test("RewardRuleAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_614_920);
  const items: RewardRuleAllocation[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRewardRuleAllocation(`reward-rule-allocation-${index}`, "sample"));
  }
  const report = buildRewardRuleAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
