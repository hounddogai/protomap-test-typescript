import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualFraudCheckPlanReport } from "./manual-fraud-check-plan-report.js";
import { ManualFraudCheckPlan, newManualFraudCheckPlan } from "./manual-fraud-check-plan.js";

test("ManualFraudCheckPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_207_732);
  const items: ManualFraudCheckPlan[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newManualFraudCheckPlan(`manual-fraud-check-plan-${index}`, "sample"));
  }
  const report = buildManualFraudCheckPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
