import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientJourneyAssignmentReport } from "./lenient-journey-assignment-report.js";
import { LenientJourneyAssignment, newLenientJourneyAssignment } from "./lenient-journey-assignment.js";

test("LenientJourneyAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_564_398);
  const items: LenientJourneyAssignment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLenientJourneyAssignment(`lenient-journey-assignment-${index}`, "sample"));
  }
  const report = buildLenientJourneyAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
