import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledEnrollmentForecastReport } from "./scheduled-enrollment-forecast-report.js";
import { ScheduledEnrollmentForecast, newScheduledEnrollmentForecast } from "./scheduled-enrollment-forecast.js";

test("ScheduledEnrollmentForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_632_466);
  const items: ScheduledEnrollmentForecast[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newScheduledEnrollmentForecast(`scheduled-enrollment-forecast-${index}`, "sample"));
  }
  const report = buildScheduledEnrollmentForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
