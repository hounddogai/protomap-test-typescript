import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalLevelAssignmentReport } from "./global-level-assignment-report.js";
import { GlobalLevelAssignment, newGlobalLevelAssignment } from "./global-level-assignment.js";

test("GlobalLevelAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_662_998);
  const items: GlobalLevelAssignment[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newGlobalLevelAssignment(`global-level-assignment-${index}`, "sample"));
  }
  const report = buildGlobalLevelAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
