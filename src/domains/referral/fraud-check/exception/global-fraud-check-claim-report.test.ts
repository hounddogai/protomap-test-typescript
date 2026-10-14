import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalFraudCheckClaimReport } from "./global-fraud-check-claim-report.js";
import { GlobalFraudCheckClaim, newGlobalFraudCheckClaim } from "./global-fraud-check-claim.js";

test("GlobalFraudCheckClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_854_627);
  const items: GlobalFraudCheckClaim[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newGlobalFraudCheckClaim(`global-fraud-check-claim-${index}`, "sample"));
  }
  const report = buildGlobalFraudCheckClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
