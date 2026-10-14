import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedPreferenceAssignmentReport } from "./capped-preference-assignment-report.js";
import { CappedPreferenceAssignment, newCappedPreferenceAssignment } from "./capped-preference-assignment.js";

test("CappedPreferenceAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_592_377);
  const items: CappedPreferenceAssignment[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCappedPreferenceAssignment(`capped-preference-assignment-${index}`, "sample"));
  }
  const report = buildCappedPreferenceAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
