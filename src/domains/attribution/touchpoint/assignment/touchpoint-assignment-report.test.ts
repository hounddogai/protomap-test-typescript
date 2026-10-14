import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTouchpointAssignmentReport } from "./touchpoint-assignment-report.js";
import { TouchpointAssignment, newTouchpointAssignment } from "./touchpoint-assignment.js";

test("TouchpointAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_619_158);
  const items: TouchpointAssignment[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newTouchpointAssignment(`touchpoint-assignment-${index}`, "sample"));
  }
  const report = buildTouchpointAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
