import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackApprovalQuotaReport } from "./fallback-approval-quota-report.js";
import { FallbackApprovalQuota, newFallbackApprovalQuota } from "./fallback-approval-quota.js";

test("FallbackApprovalQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_671_460);
  const items: FallbackApprovalQuota[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFallbackApprovalQuota(`fallback-approval-quota-${index}`, "sample"));
  }
  const report = buildFallbackApprovalQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
