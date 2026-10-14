import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledPreferenceAssignmentReport } from "./scheduled-preference-assignment-report.js";
import {
  ScheduledPreferenceAssignment,
  newScheduledPreferenceAssignment,
} from "./scheduled-preference-assignment.js";

test("ScheduledPreferenceAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_607_059);
  const items: ScheduledPreferenceAssignment[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newScheduledPreferenceAssignment(`scheduled-preference-assignment-${index}`, "sample"));
  }
  const report = buildScheduledPreferenceAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
