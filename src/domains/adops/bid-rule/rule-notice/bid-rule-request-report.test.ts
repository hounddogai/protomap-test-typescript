import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBidRuleRequestReport } from "./bid-rule-request-report.js";
import { BidRuleRequest, newBidRuleRequest } from "./bid-rule-request.js";

test("BidRuleRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_540_017);
  const items: BidRuleRequest[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBidRuleRequest(`bid-rule-request-${index}`, "sample"));
  }
  const report = buildBidRuleRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
