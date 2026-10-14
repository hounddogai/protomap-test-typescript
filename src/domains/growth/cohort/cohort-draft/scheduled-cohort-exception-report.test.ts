import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledCohortExceptionReport } from "./scheduled-cohort-exception-report.js";
import { ScheduledCohortException, newScheduledCohortException } from "./scheduled-cohort-exception.js";

test("ScheduledCohortExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_333_400);
  const items: ScheduledCohortException[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newScheduledCohortException(`scheduled-cohort-exception-${index}`, "sample"));
  }
  const report = buildScheduledCohortExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
