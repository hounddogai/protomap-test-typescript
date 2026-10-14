import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedEnrollmentMilestoneReport } from "./weighted-enrollment-milestone-report.js";
import { WeightedEnrollmentMilestone, newWeightedEnrollmentMilestone } from "./weighted-enrollment-milestone.js";

test("WeightedEnrollmentMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_679_302);
  const items: WeightedEnrollmentMilestone[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWeightedEnrollmentMilestone(`weighted-enrollment-milestone-${index}`, "sample"));
  }
  const report = buildWeightedEnrollmentMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
