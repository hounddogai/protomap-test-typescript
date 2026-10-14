import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFunnelAssignmentReport } from "./funnel-assignment-report.js";
import { FunnelAssignment, newFunnelAssignment } from "./funnel-assignment.js";

test("FunnelAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_005_444);
  const items: FunnelAssignment[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFunnelAssignment(`funnel-assignment-${index}`, "sample"));
  }
  const report = buildFunnelAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
