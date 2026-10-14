import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredMentionTierReport } from "./tiered-mention-tier-report.js";
import { TieredMentionTier, newTieredMentionTier } from "./tiered-mention-tier.js";

test("TieredMentionTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_144_440);
  const items: TieredMentionTier[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTieredMentionTier(`tiered-mention-tier-${index}`, "sample"));
  }
  const report = buildTieredMentionTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
