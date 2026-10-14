import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictOptOutClaimReport } from "./strict-opt-out-claim-report.js";
import { StrictOptOutClaim, newStrictOptOutClaim } from "./strict-opt-out-claim.js";

test("StrictOptOutClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_559_171);
  const items: StrictOptOutClaim[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newStrictOptOutClaim(`strict-opt-out-claim-${index}`, "sample"));
  }
  const report = buildStrictOptOutClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
