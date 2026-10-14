import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildJourneyVarianceReport } from "./journey-variance-report.js";
import { JourneyVariance, newJourneyVariance } from "./journey-variance.js";

test("JourneyVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_831_364);
  const items: JourneyVariance[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newJourneyVariance(`journey-variance-${index}`, "sample"));
  }
  const report = buildJourneyVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
