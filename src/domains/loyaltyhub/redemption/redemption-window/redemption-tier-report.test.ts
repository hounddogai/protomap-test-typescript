import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRedemptionTierReport } from "./redemption-tier-report.js";
import { RedemptionTier, newRedemptionTier } from "./redemption-tier.js";

test("RedemptionTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_274_406);
  const items: RedemptionTier[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRedemptionTier(`redemption-tier-${index}`, "sample"));
  }
  const report = buildRedemptionTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
