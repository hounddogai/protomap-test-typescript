import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingJourneyRollupReport } from "./rolling-journey-rollup-report.js";
import { RollingJourneyRollup, newRollingJourneyRollup } from "./rolling-journey-rollup.js";

test("RollingJourneyRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_906_655);
  const items: RollingJourneyRollup[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRollingJourneyRollup(`rolling-journey-rollup-${index}`, "sample"));
  }
  const report = buildRollingJourneyRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
