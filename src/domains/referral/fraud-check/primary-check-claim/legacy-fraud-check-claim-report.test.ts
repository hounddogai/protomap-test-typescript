import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyFraudCheckClaimReport } from "./legacy-fraud-check-claim-report.js";
import { LegacyFraudCheckClaim, newLegacyFraudCheckClaim } from "./legacy-fraud-check-claim.js";

test("LegacyFraudCheckClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_087_792);
  const items: LegacyFraudCheckClaim[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLegacyFraudCheckClaim(`legacy-fraud-check-claim-${index}`, "sample"));
  }
  const report = buildLegacyFraudCheckClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
