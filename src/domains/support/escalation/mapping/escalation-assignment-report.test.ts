import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEscalationAssignmentReport } from "./escalation-assignment-report.js";
import { EscalationAssignment, newEscalationAssignment } from "./escalation-assignment.js";

test("EscalationAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_403_541);
  const items: EscalationAssignment[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newEscalationAssignment(`escalation-assignment-${index}`, "sample"));
  }
  const report = buildEscalationAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
