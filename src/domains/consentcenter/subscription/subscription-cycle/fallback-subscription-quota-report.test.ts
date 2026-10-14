import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackSubscriptionQuotaReport } from "./fallback-subscription-quota-report.js";
import { FallbackSubscriptionQuota, newFallbackSubscriptionQuota } from "./fallback-subscription-quota.js";

test("FallbackSubscriptionQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_478_090);
  const items: FallbackSubscriptionQuota[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newFallbackSubscriptionQuota(`fallback-subscription-quota-${index}`, "sample"));
  }
  const report = buildFallbackSubscriptionQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
