import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveApprovalAgreementReport } from "./adaptive-approval-agreement-report.js";
import { AdaptiveApprovalAgreement, newAdaptiveApprovalAgreement } from "./adaptive-approval-agreement.js";

test("AdaptiveApprovalAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_881_121);
  const items: AdaptiveApprovalAgreement[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newAdaptiveApprovalAgreement(`adaptive-approval-agreement-${index}`, "sample"));
  }
  const report = buildAdaptiveApprovalAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
