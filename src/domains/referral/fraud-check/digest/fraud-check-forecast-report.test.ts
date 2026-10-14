import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFraudCheckForecastReport } from "./fraud-check-forecast-report.js";
import { FraudCheckForecast, newFraudCheckForecast } from "./fraud-check-forecast.js";

test("FraudCheckForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_992_409);
  const items: FraudCheckForecast[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newFraudCheckForecast(`fraud-check-forecast-${index}`, "sample"));
  }
  const report = buildFraudCheckForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
