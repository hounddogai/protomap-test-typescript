import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBidRuleEstimateReport } from "./bid-rule-estimate-report.js";
import { BidRuleEstimate, newBidRuleEstimate } from "./bid-rule-estimate.js";

test("BidRuleEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_431_857);
  const items: BidRuleEstimate[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBidRuleEstimate(`bid-rule-estimate-${index}`, "sample"));
  }
  const report = buildBidRuleEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
