import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMacroAssignmentReport } from "./macro-assignment-report.js";
import { MacroAssignment, newMacroAssignment } from "./macro-assignment.js";

test("MacroAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_533_534);
  const items: MacroAssignment[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newMacroAssignment(`macro-assignment-${index}`, "sample"));
  }
  const report = buildMacroAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
