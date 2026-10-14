import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimarySuppressionTierReport } from "./primary-suppression-tier-report.js";
import { PrimarySuppressionTier, newPrimarySuppressionTier } from "./primary-suppression-tier.js";

test("PrimarySuppressionTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_952_320);
  const items: PrimarySuppressionTier[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPrimarySuppressionTier(`primary-suppression-tier-${index}`, "sample"));
  }
  const report = buildPrimarySuppressionTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
