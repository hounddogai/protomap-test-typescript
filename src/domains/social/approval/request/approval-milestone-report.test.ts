import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildApprovalMilestoneReport } from "./approval-milestone-report.js";
import { ApprovalMilestone, newApprovalMilestone } from "./approval-milestone.js";

test("ApprovalMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_489_995);
  const items: ApprovalMilestone[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newApprovalMilestone(`approval-milestone-${index}`, "sample"));
  }
  const report = buildApprovalMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
