import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalSuppressionTierReport } from "./seasonal-suppression-tier-report.js";
import { SeasonalSuppressionTier, newSeasonalSuppressionTier } from "./seasonal-suppression-tier.js";

test("SeasonalSuppressionTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_600_245);
  const items: SeasonalSuppressionTier[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSeasonalSuppressionTier(`seasonal-suppression-tier-${index}`, "sample"));
  }
  const report = buildSeasonalSuppressionTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
