import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMentionTierReport } from "./mention-tier-report.js";
import { MentionTier, newMentionTier } from "./mention-tier.js";

test("MentionTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_476_991);
  const items: MentionTier[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newMentionTier(`mention-tier-${index}`, "sample"));
  }
  const report = buildMentionTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
