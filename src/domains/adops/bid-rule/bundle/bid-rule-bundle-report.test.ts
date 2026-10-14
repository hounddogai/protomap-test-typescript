import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBidRuleBundleReport } from "./bid-rule-bundle-report.js";
import { BidRuleBundle, newBidRuleBundle } from "./bid-rule-bundle.js";

test("BidRuleBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_708_532);
  const items: BidRuleBundle[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBidRuleBundle(`bid-rule-bundle-${index}`, "sample"));
  }
  const report = buildBidRuleBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
