import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalRewardRuleReport } from "./seasonal-reward-rule-report.js";
import { SeasonalRewardRule, newSeasonalRewardRule } from "./seasonal-reward-rule.js";

test("SeasonalRewardRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_762_285);
  const items: SeasonalRewardRule[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSeasonalRewardRule(`seasonal-reward-rule-${index}`, "sample"));
  }
  const report = buildSeasonalRewardRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
