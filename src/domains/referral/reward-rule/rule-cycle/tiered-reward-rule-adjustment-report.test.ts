import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredRewardRuleAdjustmentReport } from "./tiered-reward-rule-adjustment-report.js";
import { TieredRewardRuleAdjustment, newTieredRewardRuleAdjustment } from "./tiered-reward-rule-adjustment.js";

test("TieredRewardRuleAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_599_680);
  const items: TieredRewardRuleAdjustment[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTieredRewardRuleAdjustment(`tiered-reward-rule-adjustment-${index}`, "sample"));
  }
  const report = buildTieredRewardRuleAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
