import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCohortAssignmentReport } from "./cohort-assignment-report.js";
import { CohortAssignment, newCohortAssignment } from "./cohort-assignment.js";

test("CohortAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_863_761);
  const items: CohortAssignment[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCohortAssignment(`cohort-assignment-${index}`, "sample"));
  }
  const report = buildCohortAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
