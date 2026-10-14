import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedRewardRulePreferenceReport } from "./weighted-reward-rule-preference-report.js";
import { WeightedRewardRulePreference, newWeightedRewardRulePreference } from "./weighted-reward-rule-preference.js";

test("WeightedRewardRulePreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_987_021);
  const items: WeightedRewardRulePreference[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newWeightedRewardRulePreference(`weighted-reward-rule-preference-${index}`, "sample"));
  }
  const report = buildWeightedRewardRulePreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
