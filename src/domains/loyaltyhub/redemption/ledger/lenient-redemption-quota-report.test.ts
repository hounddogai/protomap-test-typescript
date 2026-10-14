import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientRedemptionQuotaReport } from "./lenient-redemption-quota-report.js";
import { LenientRedemptionQuota, newLenientRedemptionQuota } from "./lenient-redemption-quota.js";

test("LenientRedemptionQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_335_916);
  const items: LenientRedemptionQuota[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientRedemptionQuota(`lenient-redemption-quota-${index}`, "sample"));
  }
  const report = buildLenientRedemptionQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
