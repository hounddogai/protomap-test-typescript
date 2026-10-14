import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTierBundleReport } from "./tier-bundle-report.js";
import { TierBundle, newTierBundle } from "./tier-bundle.js";

test("TierBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_223_086);
  const items: TierBundle[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTierBundle(`tier-bundle-${index}`, "sample"));
  }
  const report = buildTierBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
