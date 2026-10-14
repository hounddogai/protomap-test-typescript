import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingJourneyBaselineReport } from "./rolling-journey-baseline-report.js";
import { RollingJourneyBaseline, newRollingJourneyBaseline } from "./rolling-journey-baseline.js";

test("RollingJourneyBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_285_065);
  const items: RollingJourneyBaseline[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRollingJourneyBaseline(`rolling-journey-baseline-${index}`, "sample"));
  }
  const report = buildRollingJourneyBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
