import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEnrollmentPlanReport } from "./enrollment-plan-report.js";
import { EnrollmentPlan, newEnrollmentPlan } from "./enrollment-plan.js";

test("EnrollmentPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_665_107);
  const items: EnrollmentPlan[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newEnrollmentPlan(`enrollment-plan-${index}`, "sample"));
  }
  const report = buildEnrollmentPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
