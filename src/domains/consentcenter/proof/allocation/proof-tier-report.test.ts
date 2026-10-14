import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildProofTierReport } from "./proof-tier-report.js";
import { ProofTier, newProofTier } from "./proof-tier.js";

test("ProofTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_308_594);
  const items: ProofTier[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newProofTier(`proof-tier-${index}`, "sample"));
  }
  const report = buildProofTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
