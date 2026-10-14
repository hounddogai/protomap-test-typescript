import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyBounceForecastReport } from "./legacy-bounce-forecast-report.js";
import { LegacyBounceForecast, newLegacyBounceForecast } from "./legacy-bounce-forecast.js";

test("LegacyBounceForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_469_492);
  const items: LegacyBounceForecast[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLegacyBounceForecast(`legacy-bounce-forecast-${index}`, "sample"));
  }
  const report = buildLegacyBounceForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
