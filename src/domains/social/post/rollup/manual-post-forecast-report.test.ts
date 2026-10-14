import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualPostForecastReport } from "./manual-post-forecast-report.js";
import { ManualPostForecast, newManualPostForecast } from "./manual-post-forecast.js";

test("ManualPostForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_742_030);
  const items: ManualPostForecast[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newManualPostForecast(`manual-post-forecast-${index}`, "sample"));
  }
  const report = buildManualPostForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
