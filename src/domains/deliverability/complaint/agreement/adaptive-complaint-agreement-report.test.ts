import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveComplaintAgreementReport } from "./adaptive-complaint-agreement-report.js";
import { AdaptiveComplaintAgreement, newAdaptiveComplaintAgreement } from "./adaptive-complaint-agreement.js";

test("AdaptiveComplaintAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_950_682);
  const items: AdaptiveComplaintAgreement[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newAdaptiveComplaintAgreement(`adaptive-complaint-agreement-${index}`, "sample"));
  }
  const report = buildAdaptiveComplaintAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
