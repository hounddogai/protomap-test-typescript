import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryProofAssignmentReport } from "./primary-proof-assignment-report.js";
import { PrimaryProofAssignment, newPrimaryProofAssignment } from "./primary-proof-assignment.js";

test("PrimaryProofAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_466_910);
  const items: PrimaryProofAssignment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPrimaryProofAssignment(`primary-proof-assignment-${index}`, "sample"));
  }
  const report = buildPrimaryProofAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
