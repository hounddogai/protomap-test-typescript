import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardRulePreferenceReport } from "./reward-rule-preference-report.js";
import { RewardRulePreference, newRewardRulePreference } from "./reward-rule-preference.js";

test("RewardRulePreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_456_278);
  const items: RewardRulePreference[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRewardRulePreference(`reward-rule-preference-${index}`, "sample"));
  }
  const report = buildRewardRulePreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
