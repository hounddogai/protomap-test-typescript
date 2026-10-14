import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredRewardRuleThresholdReport } from "./tiered-reward-rule-threshold-report.js";
import { TieredRewardRuleThreshold, newTieredRewardRuleThreshold } from "./tiered-reward-rule-threshold.js";

test("TieredRewardRuleThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_035_188);
  const items: TieredRewardRuleThreshold[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTieredRewardRuleThreshold(`tiered-reward-rule-threshold-${index}`, "sample"));
  }
  const report = buildTieredRewardRuleThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
