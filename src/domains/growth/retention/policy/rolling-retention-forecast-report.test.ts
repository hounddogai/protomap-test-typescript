import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingRetentionForecastReport } from "./rolling-retention-forecast-report.js";
import { RollingRetentionForecast, newRollingRetentionForecast } from "./rolling-retention-forecast.js";

test("RollingRetentionForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_041_430);
  const items: RollingRetentionForecast[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRollingRetentionForecast(`rolling-retention-forecast-${index}`, "sample"));
  }
  const report = buildRollingRetentionForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
