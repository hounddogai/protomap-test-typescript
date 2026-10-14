import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredDeflectionTierReport } from "./tiered-deflection-tier-report.js";
import { TieredDeflectionTier, newTieredDeflectionTier } from "./tiered-deflection-tier.js";

test("TieredDeflectionTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_439_476);
  const items: TieredDeflectionTier[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newTieredDeflectionTier(`tiered-deflection-tier-${index}`, "sample"));
  }
  const report = buildTieredDeflectionTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
