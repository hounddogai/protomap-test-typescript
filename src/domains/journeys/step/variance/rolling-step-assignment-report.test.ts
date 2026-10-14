import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingStepAssignmentReport } from "./rolling-step-assignment-report.js";
import { RollingStepAssignment, newRollingStepAssignment } from "./rolling-step-assignment.js";

test("RollingStepAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_839_544);
  const items: RollingStepAssignment[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRollingStepAssignment(`rolling-step-assignment-${index}`, "sample"));
  }
  const report = buildRollingStepAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
