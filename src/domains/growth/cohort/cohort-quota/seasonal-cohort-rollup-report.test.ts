import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalCohortRollupReport } from "./seasonal-cohort-rollup-report.js";
import { SeasonalCohortRollup, newSeasonalCohortRollup } from "./seasonal-cohort-rollup.js";

test("SeasonalCohortRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_643_624);
  const items: SeasonalCohortRollup[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSeasonalCohortRollup(`seasonal-cohort-rollup-${index}`, "sample"));
  }
  const report = buildSeasonalCohortRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
