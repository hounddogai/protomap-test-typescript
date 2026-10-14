import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryFraudCheckClaimReport } from "./primary-fraud-check-claim-report.js";
import { PrimaryFraudCheckClaim, newPrimaryFraudCheckClaim } from "./primary-fraud-check-claim.js";

test("PrimaryFraudCheckClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_186_544);
  const items: PrimaryFraudCheckClaim[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPrimaryFraudCheckClaim(`primary-fraud-check-claim-${index}`, "sample"));
  }
  const report = buildPrimaryFraudCheckClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
