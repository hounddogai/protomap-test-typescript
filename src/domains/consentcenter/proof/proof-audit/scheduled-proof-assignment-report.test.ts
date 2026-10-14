import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledProofAssignmentReport } from "./scheduled-proof-assignment-report.js";
import { ScheduledProofAssignment, newScheduledProofAssignment } from "./scheduled-proof-assignment.js";

test("ScheduledProofAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_733_008);
  const items: ScheduledProofAssignment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newScheduledProofAssignment(`scheduled-proof-assignment-${index}`, "sample"));
  }
  const report = buildScheduledProofAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
