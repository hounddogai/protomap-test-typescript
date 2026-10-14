import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildExitRuleThresholdReport } from "./exit-rule-threshold-report.js";
import { ExitRuleThreshold, newExitRuleThreshold } from "./exit-rule-threshold.js";

test("ExitRuleThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_464_642);
  const items: ExitRuleThreshold[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newExitRuleThreshold(`exit-rule-threshold-${index}`, "sample"));
  }
  const report = buildExitRuleThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
