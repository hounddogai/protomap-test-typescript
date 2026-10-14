import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalSubscriptionTierReport } from "./seasonal-subscription-tier-report.js";
import { SeasonalSubscriptionTier, newSeasonalSubscriptionTier } from "./seasonal-subscription-tier.js";

test("SeasonalSubscriptionTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_257_084);
  const items: SeasonalSubscriptionTier[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSeasonalSubscriptionTier(`seasonal-subscription-tier-${index}`, "sample"));
  }
  const report = buildSeasonalSubscriptionTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
