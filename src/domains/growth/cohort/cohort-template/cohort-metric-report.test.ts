import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCohortMetricReport } from "./cohort-metric-report.js";
import { CohortMetric, newCohortMetric } from "./cohort-metric.js";

test("CohortMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_466_475);
  const items: CohortMetric[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCohortMetric(`cohort-metric-${index}`, "sample"));
  }
  const report = buildCohortMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
