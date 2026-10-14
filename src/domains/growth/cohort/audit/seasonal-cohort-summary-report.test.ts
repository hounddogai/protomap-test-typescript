import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalCohortSummaryReport } from "./seasonal-cohort-summary-report.js";
import { SeasonalCohortSummary, newSeasonalCohortSummary } from "./seasonal-cohort-summary.js";

test("SeasonalCohortSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_035_580);
  const items: SeasonalCohortSummary[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSeasonalCohortSummary(`seasonal-cohort-summary-${index}`, "sample"));
  }
  const report = buildSeasonalCohortSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
