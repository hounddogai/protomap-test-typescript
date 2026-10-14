import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBidRuleGroupReport } from "./bid-rule-group-report.js";
import { BidRuleGroup, newBidRuleGroup } from "./bid-rule-group.js";

test("BidRuleGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_094_202);
  const items: BidRuleGroup[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBidRuleGroup(`bid-rule-group-${index}`, "sample"));
  }
  const report = buildBidRuleGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
