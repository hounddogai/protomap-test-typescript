import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReputationClaimReport } from "./reputation-claim-report.js";
import { ReputationClaim, newReputationClaim } from "./reputation-claim.js";

test("ReputationClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_270_674);
  const items: ReputationClaim[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newReputationClaim(`reputation-claim-${index}`, "sample"));
  }
  const report = buildReputationClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
