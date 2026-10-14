import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyFlightClaimReport } from "./legacy-flight-claim-report.js";
import { LegacyFlightClaim, newLegacyFlightClaim } from "./legacy-flight-claim.js";

test("LegacyFlightClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_251_537);
  const items: LegacyFlightClaim[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLegacyFlightClaim(`legacy-flight-claim-${index}`, "sample"));
  }
  const report = buildLegacyFlightClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
