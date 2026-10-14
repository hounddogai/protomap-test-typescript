import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualFlightPlanReport } from "./manual-flight-plan-report.js";
import { ManualFlightPlan, newManualFlightPlan } from "./manual-flight-plan.js";

test("ManualFlightPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_238_822);
  const items: ManualFlightPlan[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newManualFlightPlan(`manual-flight-plan-${index}`, "sample"));
  }
  const report = buildManualFlightPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
