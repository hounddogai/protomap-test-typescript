import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredRedemptionQuotaReport } from "./tiered-redemption-quota-report.js";
import { TieredRedemptionQuota, newTieredRedemptionQuota } from "./tiered-redemption-quota.js";

test("TieredRedemptionQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_761_009);
  const items: TieredRedemptionQuota[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTieredRedemptionQuota(`tiered-redemption-quota-${index}`, "sample"));
  }
  const report = buildTieredRedemptionQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
