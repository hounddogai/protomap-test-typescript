import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptivePaywallAgreementReport } from "./adaptive-paywall-agreement-report.js";
import { AdaptivePaywallAgreement, newAdaptivePaywallAgreement } from "./adaptive-paywall-agreement.js";

test("AdaptivePaywallAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_856_430);
  const items: AdaptivePaywallAgreement[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newAdaptivePaywallAgreement(`adaptive-paywall-agreement-${index}`, "sample"));
  }
  const report = buildAdaptivePaywallAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
