import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCohortMilestoneReport } from "./cohort-milestone-report.js";
import { CohortMilestone, newCohortMilestone } from "./cohort-milestone.js";

test("CohortMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_865_614);
  const items: CohortMilestone[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCohortMilestone(`cohort-milestone-${index}`, "sample"));
  }
  const report = buildCohortMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
