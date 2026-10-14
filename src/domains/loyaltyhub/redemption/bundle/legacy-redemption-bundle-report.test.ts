import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyRedemptionBundleReport } from "./legacy-redemption-bundle-report.js";
import { LegacyRedemptionBundle, newLegacyRedemptionBundle } from "./legacy-redemption-bundle.js";

test("LegacyRedemptionBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_413_265);
  const items: LegacyRedemptionBundle[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLegacyRedemptionBundle(`legacy-redemption-bundle-${index}`, "sample"));
  }
  const report = buildLegacyRedemptionBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
