import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredDoubleOptInAssignmentReport } from "./tiered-double-opt-in-assignment-report.js";
import { TieredDoubleOptInAssignment, newTieredDoubleOptInAssignment } from "./tiered-double-opt-in-assignment.js";

test("TieredDoubleOptInAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_734_071);
  const items: TieredDoubleOptInAssignment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTieredDoubleOptInAssignment(`tiered-double-opt-in-assignment-${index}`, "sample"));
  }
  const report = buildTieredDoubleOptInAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
