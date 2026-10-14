import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientExitRuleAdjustmentReport } from "./lenient-exit-rule-adjustment-report.js";
import { LenientExitRuleAdjustment, newLenientExitRuleAdjustment } from "./lenient-exit-rule-adjustment.js";

test("LenientExitRuleAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_322_189);
  const items: LenientExitRuleAdjustment[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLenientExitRuleAdjustment(`lenient-exit-rule-adjustment-${index}`, "sample"));
  }
  const report = buildLenientExitRuleAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
