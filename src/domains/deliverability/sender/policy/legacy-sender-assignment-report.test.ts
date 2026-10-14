import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacySenderAssignmentReport } from "./legacy-sender-assignment-report.js";
import { LegacySenderAssignment, newLegacySenderAssignment } from "./legacy-sender-assignment.js";

test("LegacySenderAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_114_856);
  const items: LegacySenderAssignment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLegacySenderAssignment(`legacy-sender-assignment-${index}`, "sample"));
  }
  const report = buildLegacySenderAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
