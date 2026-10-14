import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictJourneyRollupReport } from "./strict-journey-rollup-report.js";
import { StrictJourneyRollup, newStrictJourneyRollup } from "./strict-journey-rollup.js";

test("StrictJourneyRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_531_416);
  const items: StrictJourneyRollup[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newStrictJourneyRollup(`strict-journey-rollup-${index}`, "sample"));
  }
  const report = buildStrictJourneyRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
