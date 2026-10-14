import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDeflectionTierReport } from "./deflection-tier-report.js";
import { DeflectionTier, newDeflectionTier } from "./deflection-tier.js";

test("DeflectionTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_848_659);
  const items: DeflectionTier[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDeflectionTier(`deflection-tier-${index}`, "sample"));
  }
  const report = buildDeflectionTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
