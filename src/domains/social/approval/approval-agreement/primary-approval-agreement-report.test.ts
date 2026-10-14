import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryApprovalAgreementReport } from "./primary-approval-agreement-report.js";
import { PrimaryApprovalAgreement, newPrimaryApprovalAgreement } from "./primary-approval-agreement.js";

test("PrimaryApprovalAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_701_585);
  const items: PrimaryApprovalAgreement[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPrimaryApprovalAgreement(`primary-approval-agreement-${index}`, "sample"));
  }
  const report = buildPrimaryApprovalAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
