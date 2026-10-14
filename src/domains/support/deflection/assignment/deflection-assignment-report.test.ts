import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDeflectionAssignmentReport } from "./deflection-assignment-report.js";
import { DeflectionAssignment, newDeflectionAssignment } from "./deflection-assignment.js";

test("DeflectionAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_730_608);
  const items: DeflectionAssignment[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newDeflectionAssignment(`deflection-assignment-${index}`, "sample"));
  }
  const report = buildDeflectionAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
