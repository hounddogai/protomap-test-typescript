import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientPostTierReport } from "./lenient-post-tier-report.js";
import { LenientPostTier, newLenientPostTier } from "./lenient-post-tier.js";

test("LenientPostTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_279_102);
  const items: LenientPostTier[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLenientPostTier(`lenient-post-tier-${index}`, "sample"));
  }
  const report = buildLenientPostTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
