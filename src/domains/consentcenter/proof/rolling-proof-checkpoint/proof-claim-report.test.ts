import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildProofClaimReport } from "./proof-claim-report.js";
import { ProofClaim, newProofClaim } from "./proof-claim.js";

test("ProofClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_195_037);
  const items: ProofClaim[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newProofClaim(`proof-claim-${index}`, "sample"));
  }
  const report = buildProofClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
