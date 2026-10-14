import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryStepForecastReport } from "./primary-step-forecast-report.js";
import { PrimaryStepForecast, newPrimaryStepForecast } from "./primary-step-forecast.js";

test("PrimaryStepForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_306_826);
  const items: PrimaryStepForecast[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPrimaryStepForecast(`primary-step-forecast-${index}`, "sample"));
  }
  const report = buildPrimaryStepForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
