import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRedemptionForecastReport } from "./redemption-forecast-report.js";
import { RedemptionForecast, newRedemptionForecast } from "./redemption-forecast.js";

test("RedemptionForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_718_207);
  const items: RedemptionForecast[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRedemptionForecast(`redemption-forecast-${index}`, "sample"));
  }
  const report = buildRedemptionForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
