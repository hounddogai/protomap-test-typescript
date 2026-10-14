import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingWaitMilestoneReport } from "./pending-wait-milestone-report.js";
import { PendingWaitMilestone, newPendingWaitMilestone } from "./pending-wait-milestone.js";

test("PendingWaitMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_973_304);
  const items: PendingWaitMilestone[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPendingWaitMilestone(`pending-wait-milestone-${index}`, "sample"));
  }
  const report = buildPendingWaitMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
