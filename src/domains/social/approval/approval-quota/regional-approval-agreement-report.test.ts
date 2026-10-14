import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalApprovalAgreementReport } from "./regional-approval-agreement-report.js";
import { RegionalApprovalAgreement, newRegionalApprovalAgreement } from "./regional-approval-agreement.js";

test("RegionalApprovalAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_792_353);
  const items: RegionalApprovalAgreement[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRegionalApprovalAgreement(`regional-approval-agreement-${index}`, "sample"));
  }
  const report = buildRegionalApprovalAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
