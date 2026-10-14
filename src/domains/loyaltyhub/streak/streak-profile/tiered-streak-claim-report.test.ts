import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredStreakClaimReport } from "./tiered-streak-claim-report.js";
import { TieredStreakClaim, newTieredStreakClaim } from "./tiered-streak-claim.js";

test("TieredStreakClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_908_209);
  const items: TieredStreakClaim[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTieredStreakClaim(`tiered-streak-claim-${index}`, "sample"));
  }
  const report = buildTieredStreakClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
