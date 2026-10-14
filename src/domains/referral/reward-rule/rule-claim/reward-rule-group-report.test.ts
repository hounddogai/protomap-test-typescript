import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardRuleGroupReport } from "./reward-rule-group-report.js";
import { RewardRuleGroup, newRewardRuleGroup } from "./reward-rule-group.js";

test("RewardRuleGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_934_264);
  const items: RewardRuleGroup[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRewardRuleGroup(`reward-rule-group-${index}`, "sample"));
  }
  const report = buildRewardRuleGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
