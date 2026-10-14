import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryBadgeForecastReport } from "./primary-badge-forecast-report.js";
import { PrimaryBadgeForecast, newPrimaryBadgeForecast } from "./primary-badge-forecast.js";

test("PrimaryBadgeForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_200_557);
  const items: PrimaryBadgeForecast[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPrimaryBadgeForecast(`primary-badge-forecast-${index}`, "sample"));
  }
  const report = buildPrimaryBadgeForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
