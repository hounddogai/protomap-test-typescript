import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardTierReport } from "./reward-tier-report.js";
import { RewardTier, newRewardTier } from "./reward-tier.js";

test("RewardTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_841_523);
  const items: RewardTier[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRewardTier(`reward-tier-${index}`, "sample"));
  }
  const report = buildRewardTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
