import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryWarmupTierReport } from "./primary-warmup-tier-report.js";
import { PrimaryWarmupTier, newPrimaryWarmupTier } from "./primary-warmup-tier.js";

test("PrimaryWarmupTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_384_051);
  const items: PrimaryWarmupTier[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPrimaryWarmupTier(`primary-warmup-tier-${index}`, "sample"));
  }
  const report = buildPrimaryWarmupTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
