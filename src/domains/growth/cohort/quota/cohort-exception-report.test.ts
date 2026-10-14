import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCohortExceptionReport } from "./cohort-exception-report.js";
import { CohortException, newCohortException } from "./cohort-exception.js";

test("CohortExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_846_142);
  const items: CohortException[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCohortException(`cohort-exception-${index}`, "sample"));
  }
  const report = buildCohortExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
