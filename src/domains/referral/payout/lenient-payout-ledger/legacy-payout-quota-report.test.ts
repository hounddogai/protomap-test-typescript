import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyPayoutQuotaReport } from "./legacy-payout-quota-report.js";
import { LegacyPayoutQuota, newLegacyPayoutQuota } from "./legacy-payout-quota.js";

test("LegacyPayoutQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_646_607);
  const items: LegacyPayoutQuota[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLegacyPayoutQuota(`legacy-payout-quota-${index}`, "sample"));
  }
  const report = buildLegacyPayoutQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
