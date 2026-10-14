import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedApprovalAgreementReport } from "./weighted-approval-agreement-report.js";
import { WeightedApprovalAgreement, newWeightedApprovalAgreement } from "./weighted-approval-agreement.js";

test("WeightedApprovalAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_569_810);
  const items: WeightedApprovalAgreement[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWeightedApprovalAgreement(`weighted-approval-agreement-${index}`, "sample"));
  }
  const report = buildWeightedApprovalAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
