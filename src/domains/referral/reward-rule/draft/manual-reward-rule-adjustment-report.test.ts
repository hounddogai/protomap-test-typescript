import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualRewardRuleAdjustmentReport } from "./manual-reward-rule-adjustment-report.js";
import { ManualRewardRuleAdjustment, newManualRewardRuleAdjustment } from "./manual-reward-rule-adjustment.js";

test("ManualRewardRuleAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_428_115);
  const items: ManualRewardRuleAdjustment[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newManualRewardRuleAdjustment(`manual-reward-rule-adjustment-${index}`, "sample"));
  }
  const report = buildManualRewardRuleAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
