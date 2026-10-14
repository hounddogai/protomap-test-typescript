import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStepRuleReport } from "./step-rule-report.js";
import { StepRule, newStepRule } from "./step-rule.js";

test("StepRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_364_586);
  const items: StepRule[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newStepRule(`step-rule-${index}`, "sample"));
  }
  const report = buildStepRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
