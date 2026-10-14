import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyStreakTierReport } from "./legacy-streak-tier-report.js";
import { LegacyStreakTier, newLegacyStreakTier } from "./legacy-streak-tier.js";

test("LegacyStreakTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_917_097);
  const items: LegacyStreakTier[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLegacyStreakTier(`legacy-streak-tier-${index}`, "sample"));
  }
  const report = buildLegacyStreakTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
