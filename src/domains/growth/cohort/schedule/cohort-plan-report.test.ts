import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCohortPlanReport } from "./cohort-plan-report.js";
import { CohortPlan, newCohortPlan } from "./cohort-plan.js";

test("CohortPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_739_515);
  const items: CohortPlan[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newCohortPlan(`cohort-plan-${index}`, "sample"));
  }
  const report = buildCohortPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
