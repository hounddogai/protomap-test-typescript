import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyCohortTierReport } from "./legacy-cohort-tier-report.js";
import { LegacyCohortTier, newLegacyCohortTier } from "./legacy-cohort-tier.js";

test("LegacyCohortTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_195_868);
  const items: LegacyCohortTier[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLegacyCohortTier(`legacy-cohort-tier-${index}`, "sample"));
  }
  const report = buildLegacyCohortTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
