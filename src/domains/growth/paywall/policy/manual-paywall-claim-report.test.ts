import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualPaywallClaimReport } from "./manual-paywall-claim-report.js";
import { ManualPaywallClaim, newManualPaywallClaim } from "./manual-paywall-claim.js";

test("ManualPaywallClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_082_747);
  const items: ManualPaywallClaim[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newManualPaywallClaim(`manual-paywall-claim-${index}`, "sample"));
  }
  const report = buildManualPaywallClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
