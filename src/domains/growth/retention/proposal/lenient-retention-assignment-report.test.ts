import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientRetentionAssignmentReport } from "./lenient-retention-assignment-report.js";
import { LenientRetentionAssignment, newLenientRetentionAssignment } from "./lenient-retention-assignment.js";

test("LenientRetentionAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_624_694);
  const items: LenientRetentionAssignment[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientRetentionAssignment(`lenient-retention-assignment-${index}`, "sample"));
  }
  const report = buildLenientRetentionAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
