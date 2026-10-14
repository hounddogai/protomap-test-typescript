import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedRewardRuleSummaryReport } from "./weighted-reward-rule-summary-report.js";
import { WeightedRewardRuleSummary, newWeightedRewardRuleSummary } from "./weighted-reward-rule-summary.js";

test("WeightedRewardRuleSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_884_847);
  const items: WeightedRewardRuleSummary[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWeightedRewardRuleSummary(`weighted-reward-rule-summary-${index}`, "sample"));
  }
  const report = buildWeightedRewardRuleSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
