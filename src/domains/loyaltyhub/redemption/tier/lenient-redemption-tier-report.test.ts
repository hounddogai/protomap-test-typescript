import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientRedemptionTierReport } from "./lenient-redemption-tier-report.js";
import { LenientRedemptionTier, newLenientRedemptionTier } from "./lenient-redemption-tier.js";

test("LenientRedemptionTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_340_440);
  const items: LenientRedemptionTier[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLenientRedemptionTier(`lenient-redemption-tier-${index}`, "sample"));
  }
  const report = buildLenientRedemptionTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
