import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictPlacementForecastReport } from "./strict-placement-forecast-report.js";
import { StrictPlacementForecast, newStrictPlacementForecast } from "./strict-placement-forecast.js";

test("StrictPlacementForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_800_881);
  const items: StrictPlacementForecast[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newStrictPlacementForecast(`strict-placement-forecast-${index}`, "sample"));
  }
  const report = buildStrictPlacementForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
