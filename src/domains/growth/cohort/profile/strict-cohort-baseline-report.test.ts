import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictCohortBaselineReport } from "./strict-cohort-baseline-report.js";
import { StrictCohortBaseline, newStrictCohortBaseline } from "./strict-cohort-baseline.js";

test("StrictCohortBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_050_821);
  const items: StrictCohortBaseline[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newStrictCohortBaseline(`strict-cohort-baseline-${index}`, "sample"));
  }
  const report = buildStrictCohortBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
