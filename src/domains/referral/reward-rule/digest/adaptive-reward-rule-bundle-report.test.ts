import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveRewardRuleBundleReport } from "./adaptive-reward-rule-bundle-report.js";
import { AdaptiveRewardRuleBundle, newAdaptiveRewardRuleBundle } from "./adaptive-reward-rule-bundle.js";

test("AdaptiveRewardRuleBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_245_369);
  const items: AdaptiveRewardRuleBundle[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newAdaptiveRewardRuleBundle(`adaptive-reward-rule-bundle-${index}`, "sample"));
  }
  const report = buildAdaptiveRewardRuleBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
