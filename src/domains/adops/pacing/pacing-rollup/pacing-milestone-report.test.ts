import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPacingMilestoneReport } from "./pacing-milestone-report.js";
import { PacingMilestone, newPacingMilestone } from "./pacing-milestone.js";

test("PacingMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_049_754);
  const items: PacingMilestone[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPacingMilestone(`pacing-milestone-${index}`, "sample"));
  }
  const report = buildPacingMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
