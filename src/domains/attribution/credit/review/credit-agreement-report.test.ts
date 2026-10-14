import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreditAgreementReport } from "./credit-agreement-report.js";
import { CreditAgreement, newCreditAgreement } from "./credit-agreement.js";

test("CreditAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_275_837);
  const items: CreditAgreement[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCreditAgreement(`credit-agreement-${index}`, "sample"));
  }
  const report = buildCreditAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
