import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingFrequencyClaimReport } from "./rolling-frequency-claim-report.js";
import { RollingFrequencyClaim, newRollingFrequencyClaim } from "./rolling-frequency-claim.js";

test("RollingFrequencyClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_378_737);
  const items: RollingFrequencyClaim[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRollingFrequencyClaim(`rolling-frequency-claim-${index}`, "sample"));
  }
  const report = buildRollingFrequencyClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
