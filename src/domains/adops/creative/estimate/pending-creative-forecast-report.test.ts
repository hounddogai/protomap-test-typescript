import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingCreativeForecastReport } from "./pending-creative-forecast-report.js";
import { PendingCreativeForecast, newPendingCreativeForecast } from "./pending-creative-forecast.js";

test("PendingCreativeForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_356_773);
  const items: PendingCreativeForecast[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPendingCreativeForecast(`pending-creative-forecast-${index}`, "sample"));
  }
  const report = buildPendingCreativeForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
