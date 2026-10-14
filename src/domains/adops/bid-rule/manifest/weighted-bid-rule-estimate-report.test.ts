import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedBidRuleEstimateReport } from "./weighted-bid-rule-estimate-report.js";
import { WeightedBidRuleEstimate, newWeightedBidRuleEstimate } from "./weighted-bid-rule-estimate.js";

test("WeightedBidRuleEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_495_084);
  const items: WeightedBidRuleEstimate[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWeightedBidRuleEstimate(`weighted-bid-rule-estimate-${index}`, "sample"));
  }
  const report = buildWeightedBidRuleEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
