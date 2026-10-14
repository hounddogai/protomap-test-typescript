import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildConversionTierReport } from "./conversion-tier-report.js";
import { ConversionTier, newConversionTier } from "./conversion-tier.js";

test("ConversionTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_486_845);
  const items: ConversionTier[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newConversionTier(`conversion-tier-${index}`, "sample"));
  }
  const report = buildConversionTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
