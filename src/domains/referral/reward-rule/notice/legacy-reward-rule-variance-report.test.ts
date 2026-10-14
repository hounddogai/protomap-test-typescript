import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyRewardRuleVarianceReport } from "./legacy-reward-rule-variance-report.js";
import { LegacyRewardRuleVariance, newLegacyRewardRuleVariance } from "./legacy-reward-rule-variance.js";

test("LegacyRewardRuleVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_592_236);
  const items: LegacyRewardRuleVariance[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLegacyRewardRuleVariance(`legacy-reward-rule-variance-${index}`, "sample"));
  }
  const report = buildLegacyRewardRuleVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
