import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardRuleBaselineReport } from "./reward-rule-baseline-report.js";
import { RewardRuleBaseline, newRewardRuleBaseline } from "./reward-rule-baseline.js";

test("RewardRuleBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_449_336);
  const items: RewardRuleBaseline[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRewardRuleBaseline(`reward-rule-baseline-${index}`, "sample"));
  }
  const report = buildRewardRuleBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
