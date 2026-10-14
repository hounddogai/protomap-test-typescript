import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildJourneyForecastReport } from "./journey-forecast-report.js";
import { JourneyForecast, newJourneyForecast } from "./journey-forecast.js";

test("JourneyForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_130_321);
  const items: JourneyForecast[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newJourneyForecast(`journey-forecast-${index}`, "sample"));
  }
  const report = buildJourneyForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
