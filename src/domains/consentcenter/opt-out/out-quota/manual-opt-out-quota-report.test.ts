import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualOptOutQuotaReport } from "./manual-opt-out-quota-report.js";
import { ManualOptOutQuota, newManualOptOutQuota } from "./manual-opt-out-quota.js";

test("ManualOptOutQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_759_736);
  const items: ManualOptOutQuota[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newManualOptOutQuota(`manual-opt-out-quota-${index}`, "sample"));
  }
  const report = buildManualOptOutQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
