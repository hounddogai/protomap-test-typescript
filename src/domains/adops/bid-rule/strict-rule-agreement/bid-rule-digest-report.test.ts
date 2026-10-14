import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBidRuleDigestReport } from "./bid-rule-digest-report.js";
import { BidRuleDigest, newBidRuleDigest } from "./bid-rule-digest.js";

test("BidRuleDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_526_364);
  const items: BidRuleDigest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBidRuleDigest(`bid-rule-digest-${index}`, "sample"));
  }
  const report = buildBidRuleDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
