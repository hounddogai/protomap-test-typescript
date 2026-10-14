import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSuppressionForecastReport } from "./suppression-forecast-report.js";
import { SuppressionForecast, newSuppressionForecast } from "./suppression-forecast.js";

test("SuppressionForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_202_390);
  const items: SuppressionForecast[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSuppressionForecast(`suppression-forecast-${index}`, "sample"));
  }
  const report = buildSuppressionForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
