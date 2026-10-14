import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingApprovalMilestoneReport } from "./pending-approval-milestone-report.js";
import { PendingApprovalMilestone, newPendingApprovalMilestone } from "./pending-approval-milestone.js";

test("PendingApprovalMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_155_451);
  const items: PendingApprovalMilestone[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPendingApprovalMilestone(`pending-approval-milestone-${index}`, "sample"));
  }
  const report = buildPendingApprovalMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
