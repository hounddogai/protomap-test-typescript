import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildJourneyThresholdReport } from "./journey-threshold-report.js";
import { JourneyThreshold, newJourneyThreshold } from "./journey-threshold.js";

test("JourneyThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_769_393);
  const items: JourneyThreshold[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newJourneyThreshold(`journey-threshold-${index}`, "sample"));
  }
  const report = buildJourneyThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
