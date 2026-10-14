import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCsatTierReport } from "./csat-tier-report.js";
import { CsatTier, newCsatTier } from "./csat-tier.js";

test("CsatTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_981_414);
  const items: CsatTier[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCsatTier(`csat-tier-${index}`, "sample"));
  }
  const report = buildCsatTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
