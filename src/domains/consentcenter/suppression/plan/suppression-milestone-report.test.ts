import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSuppressionMilestoneReport } from "./suppression-milestone-report.js";
import { SuppressionMilestone, newSuppressionMilestone } from "./suppression-milestone.js";

test("SuppressionMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_065_097);
  const items: SuppressionMilestone[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSuppressionMilestone(`suppression-milestone-${index}`, "sample"));
  }
  const report = buildSuppressionMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
