import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualBadgeForecastReport } from "./manual-badge-forecast-report.js";
import { ManualBadgeForecast, newManualBadgeForecast } from "./manual-badge-forecast.js";

test("ManualBadgeForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_056_748);
  const items: ManualBadgeForecast[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newManualBadgeForecast(`manual-badge-forecast-${index}`, "sample"));
  }
  const report = buildManualBadgeForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
