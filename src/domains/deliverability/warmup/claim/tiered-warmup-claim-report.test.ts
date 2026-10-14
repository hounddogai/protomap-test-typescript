import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredWarmupClaimReport } from "./tiered-warmup-claim-report.js";
import { TieredWarmupClaim, newTieredWarmupClaim } from "./tiered-warmup-claim.js";

test("TieredWarmupClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_755_819);
  const items: TieredWarmupClaim[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTieredWarmupClaim(`tiered-warmup-claim-${index}`, "sample"));
  }
  const report = buildTieredWarmupClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
