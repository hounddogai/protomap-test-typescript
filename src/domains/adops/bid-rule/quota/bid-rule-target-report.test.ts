import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBidRuleTargetReport } from "./bid-rule-target-report.js";
import { BidRuleTarget, newBidRuleTarget } from "./bid-rule-target.js";

test("BidRuleTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_065_016);
  const items: BidRuleTarget[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBidRuleTarget(`bid-rule-target-${index}`, "sample"));
  }
  const report = buildBidRuleTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
