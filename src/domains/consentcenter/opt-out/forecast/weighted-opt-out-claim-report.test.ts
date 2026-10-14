import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedOptOutClaimReport } from "./weighted-opt-out-claim-report.js";
import { WeightedOptOutClaim, newWeightedOptOutClaim } from "./weighted-opt-out-claim.js";

test("WeightedOptOutClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_006_484);
  const items: WeightedOptOutClaim[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newWeightedOptOutClaim(`weighted-opt-out-claim-${index}`, "sample"));
  }
  const report = buildWeightedOptOutClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
