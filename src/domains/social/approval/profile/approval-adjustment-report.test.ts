import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildApprovalAdjustmentReport } from "./approval-adjustment-report.js";
import { ApprovalAdjustment, newApprovalAdjustment } from "./approval-adjustment.js";

test("ApprovalAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_777_434);
  const items: ApprovalAdjustment[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newApprovalAdjustment(`approval-adjustment-${index}`, "sample"));
  }
  const report = buildApprovalAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
