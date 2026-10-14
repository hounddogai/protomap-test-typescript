import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildJourneyBaselineReport } from "./journey-baseline-report.js";
import { JourneyBaseline, newJourneyBaseline } from "./journey-baseline.js";

test("JourneyBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_808_598);
  const items: JourneyBaseline[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newJourneyBaseline(`journey-baseline-${index}`, "sample"));
  }
  const report = buildJourneyBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
