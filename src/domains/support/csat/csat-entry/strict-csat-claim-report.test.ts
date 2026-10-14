import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictCsatClaimReport } from "./strict-csat-claim-report.js";
import { StrictCsatClaim, newStrictCsatClaim } from "./strict-csat-claim.js";

test("StrictCsatClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_195_314);
  const items: StrictCsatClaim[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newStrictCsatClaim(`strict-csat-claim-${index}`, "sample"));
  }
  const report = buildStrictCsatClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
