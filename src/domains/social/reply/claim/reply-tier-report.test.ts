import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReplyTierReport } from "./reply-tier-report.js";
import { ReplyTier, newReplyTier } from "./reply-tier.js";

test("ReplyTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_359_508);
  const items: ReplyTier[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newReplyTier(`reply-tier-${index}`, "sample"));
  }
  const report = buildReplyTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
