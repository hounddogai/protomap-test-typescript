import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveDoubleOptInPlanReport } from "./adaptive-double-opt-in-plan-report.js";
import { AdaptiveDoubleOptInPlan, newAdaptiveDoubleOptInPlan } from "./adaptive-double-opt-in-plan.js";

test("AdaptiveDoubleOptInPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_992_149);
  const items: AdaptiveDoubleOptInPlan[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newAdaptiveDoubleOptInPlan(`adaptive-double-opt-in-plan-${index}`, "sample"));
  }
  const report = buildAdaptiveDoubleOptInPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
