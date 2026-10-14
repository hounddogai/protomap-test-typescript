import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyProofClaimReport } from "./legacy-proof-claim-report.js";
import { LegacyProofClaim, newLegacyProofClaim } from "./legacy-proof-claim.js";

test("LegacyProofClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_920_660);
  const items: LegacyProofClaim[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLegacyProofClaim(`legacy-proof-claim-${index}`, "sample"));
  }
  const report = buildLegacyProofClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
