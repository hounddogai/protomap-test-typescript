import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPlacementForecastReport } from "./placement-forecast-report.js";
import { PlacementForecast, newPlacementForecast } from "./placement-forecast.js";

test("PlacementForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_428_812);
  const items: PlacementForecast[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPlacementForecast(`placement-forecast-${index}`, "sample"));
  }
  const report = buildPlacementForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
