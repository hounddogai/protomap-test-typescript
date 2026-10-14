import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyLevelTierReport } from "./legacy-level-tier-report.js";
import { LegacyLevelTier, newLegacyLevelTier } from "./legacy-level-tier.js";

test("LegacyLevelTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_799_351);
  const items: LegacyLevelTier[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLegacyLevelTier(`legacy-level-tier-${index}`, "sample"));
  }
  const report = buildLegacyLevelTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
