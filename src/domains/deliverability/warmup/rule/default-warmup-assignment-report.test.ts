import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultWarmupAssignmentReport } from "./default-warmup-assignment-report.js";
import { DefaultWarmupAssignment, newDefaultWarmupAssignment } from "./default-warmup-assignment.js";

test("DefaultWarmupAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_165_610);
  const items: DefaultWarmupAssignment[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newDefaultWarmupAssignment(`default-warmup-assignment-${index}`, "sample"));
  }
  const report = buildDefaultWarmupAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
