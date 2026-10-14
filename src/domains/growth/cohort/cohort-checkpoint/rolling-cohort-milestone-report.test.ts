import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingCohortMilestoneReport } from "./rolling-cohort-milestone-report.js";
import { RollingCohortMilestone, newRollingCohortMilestone } from "./rolling-cohort-milestone.js";

test("RollingCohortMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_435_261);
  const items: RollingCohortMilestone[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRollingCohortMilestone(`rolling-cohort-milestone-${index}`, "sample"));
  }
  const report = buildRollingCohortMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
