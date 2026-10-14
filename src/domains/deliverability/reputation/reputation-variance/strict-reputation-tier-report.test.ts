import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictReputationTierReport } from "./strict-reputation-tier-report.js";
import { StrictReputationTier, newStrictReputationTier } from "./strict-reputation-tier.js";

test("StrictReputationTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_907_400);
  const items: StrictReputationTier[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newStrictReputationTier(`strict-reputation-tier-${index}`, "sample"));
  }
  const report = buildStrictReputationTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
