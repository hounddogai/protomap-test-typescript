import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalTouchpointPlanReport } from "./global-touchpoint-plan-report.js";
import { GlobalTouchpointPlan, newGlobalTouchpointPlan } from "./global-touchpoint-plan.js";

test("GlobalTouchpointPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_586_935);
  const items: GlobalTouchpointPlan[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newGlobalTouchpointPlan(`global-touchpoint-plan-${index}`, "sample"));
  }
  const report = buildGlobalTouchpointPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
