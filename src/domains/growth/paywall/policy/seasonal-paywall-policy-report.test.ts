import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalPaywallPolicyReport } from "./seasonal-paywall-policy-report.js";
import { SeasonalPaywallPolicy, newSeasonalPaywallPolicy } from "./seasonal-paywall-policy.js";

test("SeasonalPaywallPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_334_433);
  const items: SeasonalPaywallPolicy[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSeasonalPaywallPolicy(`seasonal-paywall-policy-${index}`, "sample"));
  }
  const report = buildSeasonalPaywallPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
