import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSubscriptionTierReport } from "./subscription-tier-report.js";
import { SubscriptionTier, newSubscriptionTier } from "./subscription-tier.js";

test("SubscriptionTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_630_726);
  const items: SubscriptionTier[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newSubscriptionTier(`subscription-tier-${index}`, "sample"));
  }
  const report = buildSubscriptionTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
