import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDoubleOptInForecastReport } from "./double-opt-in-forecast-report.js";
import { DoubleOptInForecast, newDoubleOptInForecast } from "./double-opt-in-forecast.js";

test("DoubleOptInForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_237_534);
  const items: DoubleOptInForecast[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newDoubleOptInForecast(`double-opt-in-forecast-${index}`, "sample"));
  }
  const report = buildDoubleOptInForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
