import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBidRuleAgreementReport } from "./bid-rule-agreement-report.js";
import { BidRuleAgreement, newBidRuleAgreement } from "./bid-rule-agreement.js";

test("BidRuleAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_327_158);
  const items: BidRuleAgreement[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBidRuleAgreement(`bid-rule-agreement-${index}`, "sample"));
  }
  const report = buildBidRuleAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
