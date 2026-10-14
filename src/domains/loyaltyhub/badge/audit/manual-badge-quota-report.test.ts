import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualBadgeQuotaReport } from "./manual-badge-quota-report.js";
import { ManualBadgeQuota, newManualBadgeQuota } from "./manual-badge-quota.js";

test("ManualBadgeQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_408_261);
  const items: ManualBadgeQuota[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newManualBadgeQuota(`manual-badge-quota-${index}`, "sample"));
  }
  const report = buildManualBadgeQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
