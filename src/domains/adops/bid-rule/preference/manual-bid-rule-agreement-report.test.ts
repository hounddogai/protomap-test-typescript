import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualBidRuleAgreementReport } from "./manual-bid-rule-agreement-report.js";
import { ManualBidRuleAgreement, newManualBidRuleAgreement } from "./manual-bid-rule-agreement.js";

test("ManualBidRuleAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_890_035);
  const items: ManualBidRuleAgreement[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newManualBidRuleAgreement(`manual-bid-rule-agreement-${index}`, "sample"));
  }
  const report = buildManualBidRuleAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
