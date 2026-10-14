import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedOptOutAssignmentReport } from "./capped-opt-out-assignment-report.js";
import { CappedOptOutAssignment, newCappedOptOutAssignment } from "./capped-opt-out-assignment.js";

test("CappedOptOutAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_295_191);
  const items: CappedOptOutAssignment[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCappedOptOutAssignment(`capped-opt-out-assignment-${index}`, "sample"));
  }
  const report = buildCappedOptOutAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
