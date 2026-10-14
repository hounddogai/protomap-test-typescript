import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualCreditAgreementReport } from "./manual-credit-agreement-report.js";
import { ManualCreditAgreement, newManualCreditAgreement } from "./manual-credit-agreement.js";

test("ManualCreditAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_743_275);
  const items: ManualCreditAgreement[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newManualCreditAgreement(`manual-credit-agreement-${index}`, "sample"));
  }
  const report = buildManualCreditAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
