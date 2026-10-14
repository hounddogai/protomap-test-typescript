import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptivePayoutAgreementReport } from "./adaptive-payout-agreement-report.js";
import { AdaptivePayoutAgreement, newAdaptivePayoutAgreement } from "./adaptive-payout-agreement.js";

test("AdaptivePayoutAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_349_344);
  const items: AdaptivePayoutAgreement[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newAdaptivePayoutAgreement(`adaptive-payout-agreement-${index}`, "sample"));
  }
  const report = buildAdaptivePayoutAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
