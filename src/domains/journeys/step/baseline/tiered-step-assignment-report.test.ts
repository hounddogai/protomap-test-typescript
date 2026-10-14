import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredStepAssignmentReport } from "./tiered-step-assignment-report.js";
import { TieredStepAssignment, newTieredStepAssignment } from "./tiered-step-assignment.js";

test("TieredStepAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_458_534);
  const items: TieredStepAssignment[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTieredStepAssignment(`tiered-step-assignment-${index}`, "sample"));
  }
  const report = buildTieredStepAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
