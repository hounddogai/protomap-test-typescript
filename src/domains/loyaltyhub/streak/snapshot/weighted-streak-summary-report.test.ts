import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedStreakSummaryReport } from "./weighted-streak-summary-report.js";
import { WeightedStreakSummary, newWeightedStreakSummary } from "./weighted-streak-summary.js";

test("WeightedStreakSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_778_040);
  const items: WeightedStreakSummary[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWeightedStreakSummary(`weighted-streak-summary-${index}`, "sample"));
  }
  const report = buildWeightedStreakSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
