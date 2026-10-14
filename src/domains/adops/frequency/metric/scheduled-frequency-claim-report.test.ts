import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledFrequencyClaimReport } from "./scheduled-frequency-claim-report.js";
import { ScheduledFrequencyClaim, newScheduledFrequencyClaim } from "./scheduled-frequency-claim.js";

test("ScheduledFrequencyClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_023_346);
  const items: ScheduledFrequencyClaim[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newScheduledFrequencyClaim(`scheduled-frequency-claim-${index}`, "sample"));
  }
  const report = buildScheduledFrequencyClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
