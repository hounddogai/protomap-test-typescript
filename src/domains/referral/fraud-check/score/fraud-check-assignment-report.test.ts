import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFraudCheckAssignmentReport } from "./fraud-check-assignment-report.js";
import { FraudCheckAssignment, newFraudCheckAssignment } from "./fraud-check-assignment.js";

test("FraudCheckAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_242_413);
  const items: FraudCheckAssignment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFraudCheckAssignment(`fraud-check-assignment-${index}`, "sample"));
  }
  const report = buildFraudCheckAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
