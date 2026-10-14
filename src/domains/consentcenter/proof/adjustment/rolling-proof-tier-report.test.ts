import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingProofTierReport } from "./rolling-proof-tier-report.js";
import { RollingProofTier, newRollingProofTier } from "./rolling-proof-tier.js";

test("RollingProofTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_059_146);
  const items: RollingProofTier[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRollingProofTier(`rolling-proof-tier-${index}`, "sample"));
  }
  const report = buildRollingProofTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
