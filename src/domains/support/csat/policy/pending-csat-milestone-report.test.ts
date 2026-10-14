import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingCsatMilestoneReport } from "./pending-csat-milestone-report.js";
import { PendingCsatMilestone, newPendingCsatMilestone } from "./pending-csat-milestone.js";

test("PendingCsatMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_102_374);
  const items: PendingCsatMilestone[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPendingCsatMilestone(`pending-csat-milestone-${index}`, "sample"));
  }
  const report = buildPendingCsatMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
