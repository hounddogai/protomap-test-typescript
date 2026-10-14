import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRetentionAssignmentReport } from "./retention-assignment-report.js";
import { RetentionAssignment, newRetentionAssignment } from "./retention-assignment.js";

test("RetentionAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_962_766);
  const items: RetentionAssignment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRetentionAssignment(`retention-assignment-${index}`, "sample"));
  }
  const report = buildRetentionAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
