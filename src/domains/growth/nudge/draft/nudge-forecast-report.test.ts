import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildNudgeForecastReport } from "./nudge-forecast-report.js";
import { NudgeForecast, newNudgeForecast } from "./nudge-forecast.js";

test("NudgeForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_568_473);
  const items: NudgeForecast[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newNudgeForecast(`nudge-forecast-${index}`, "sample"));
  }
  const report = buildNudgeForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
