import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveRedemptionPlanReport } from "./adaptive-redemption-plan-report.js";
import { AdaptiveRedemptionPlan, newAdaptiveRedemptionPlan } from "./adaptive-redemption-plan.js";

test("AdaptiveRedemptionPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_671_847);
  const items: AdaptiveRedemptionPlan[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newAdaptiveRedemptionPlan(`adaptive-redemption-plan-${index}`, "sample"));
  }
  const report = buildAdaptiveRedemptionPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
