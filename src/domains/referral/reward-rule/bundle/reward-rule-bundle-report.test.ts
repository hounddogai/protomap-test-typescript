import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardRuleBundleReport } from "./reward-rule-bundle-report.js";
import { RewardRuleBundle, newRewardRuleBundle } from "./reward-rule-bundle.js";

test("RewardRuleBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_204_665);
  const items: RewardRuleBundle[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRewardRuleBundle(`reward-rule-bundle-${index}`, "sample"));
  }
  const report = buildRewardRuleBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
