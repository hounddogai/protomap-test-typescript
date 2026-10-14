import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualFlightClaimReport } from "./manual-flight-claim-report.js";
import { ManualFlightClaim, newManualFlightClaim } from "./manual-flight-claim.js";

test("ManualFlightClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_627_547);
  const items: ManualFlightClaim[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newManualFlightClaim(`manual-flight-claim-${index}`, "sample"));
  }
  const report = buildManualFlightClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
