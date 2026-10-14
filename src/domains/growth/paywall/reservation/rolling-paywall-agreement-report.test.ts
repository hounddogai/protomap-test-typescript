import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingPaywallAgreementReport } from "./rolling-paywall-agreement-report.js";
import { RollingPaywallAgreement, newRollingPaywallAgreement } from "./rolling-paywall-agreement.js";

test("RollingPaywallAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_222_421);
  const items: RollingPaywallAgreement[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRollingPaywallAgreement(`rolling-paywall-agreement-${index}`, "sample"));
  }
  const report = buildRollingPaywallAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
