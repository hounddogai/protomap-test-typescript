import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedFlightPlanReport } from "./weighted-flight-plan-report.js";
import { WeightedFlightPlan, newWeightedFlightPlan } from "./weighted-flight-plan.js";

test("WeightedFlightPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_432_854);
  const items: WeightedFlightPlan[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWeightedFlightPlan(`weighted-flight-plan-${index}`, "sample"));
  }
  const report = buildWeightedFlightPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
