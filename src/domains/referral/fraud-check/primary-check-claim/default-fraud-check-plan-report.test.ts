import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultFraudCheckPlanReport } from "./default-fraud-check-plan-report.js";
import { DefaultFraudCheckPlan, newDefaultFraudCheckPlan } from "./default-fraud-check-plan.js";

test("DefaultFraudCheckPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_899_973);
  const items: DefaultFraudCheckPlan[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDefaultFraudCheckPlan(`default-fraud-check-plan-${index}`, "sample"));
  }
  const report = buildDefaultFraudCheckPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
