import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredLevelClaimReport } from "./tiered-level-claim-report.js";
import { TieredLevelClaim, newTieredLevelClaim } from "./tiered-level-claim.js";

test("TieredLevelClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_523_275);
  const items: TieredLevelClaim[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTieredLevelClaim(`tiered-level-claim-${index}`, "sample"));
  }
  const report = buildTieredLevelClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
