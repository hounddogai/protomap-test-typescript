import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledWarmupClaimReport } from "./scheduled-warmup-claim-report.js";
import { ScheduledWarmupClaim, newScheduledWarmupClaim } from "./scheduled-warmup-claim.js";

test("ScheduledWarmupClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_923_328);
  const items: ScheduledWarmupClaim[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newScheduledWarmupClaim(`scheduled-warmup-claim-${index}`, "sample"));
  }
  const report = buildScheduledWarmupClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
