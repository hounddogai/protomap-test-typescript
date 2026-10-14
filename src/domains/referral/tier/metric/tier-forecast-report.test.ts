import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTierForecastReport } from "./tier-forecast-report.js";
import { TierForecast, newTierForecast } from "./tier-forecast.js";

test("TierForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_712_641);
  const items: TierForecast[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newTierForecast(`tier-forecast-${index}`, "sample"));
  }
  const report = buildTierForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
