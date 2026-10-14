import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedApprovalQuotaReport } from "./batched-approval-quota-report.js";
import { BatchedApprovalQuota, newBatchedApprovalQuota } from "./batched-approval-quota.js";

test("BatchedApprovalQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_685_622);
  const items: BatchedApprovalQuota[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBatchedApprovalQuota(`batched-approval-quota-${index}`, "sample"));
  }
  const report = buildBatchedApprovalQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
