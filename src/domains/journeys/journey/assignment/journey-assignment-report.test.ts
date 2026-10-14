import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildJourneyAssignmentReport } from "./journey-assignment-report.js";
import { JourneyAssignment, newJourneyAssignment } from "./journey-assignment.js";

test("JourneyAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_351_764);
  const items: JourneyAssignment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newJourneyAssignment(`journey-assignment-${index}`, "sample"));
  }
  const report = buildJourneyAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
