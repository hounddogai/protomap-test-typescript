import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPaywallPolicyReport } from "./paywall-policy-report.js";
import { PaywallPolicy, newPaywallPolicy } from "./paywall-policy.js";

test("PaywallPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_983_286);
  const items: PaywallPolicy[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPaywallPolicy(`paywall-policy-${index}`, "sample"));
  }
  const report = buildPaywallPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
