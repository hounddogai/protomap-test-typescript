import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredBidRuleEstimateReport } from "./tiered-bid-rule-estimate-report.js";
import { TieredBidRuleEstimate, newTieredBidRuleEstimate } from "./tiered-bid-rule-estimate.js";

test("TieredBidRuleEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_346_143);
  const items: TieredBidRuleEstimate[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTieredBidRuleEstimate(`tiered-bid-rule-estimate-${index}`, "sample"));
  }
  const report = buildTieredBidRuleEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
