import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSenderForecastReport } from "./sender-forecast-report.js";
import { SenderForecast, newSenderForecast } from "./sender-forecast.js";

test("SenderForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_763_933);
  const items: SenderForecast[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSenderForecast(`sender-forecast-${index}`, "sample"));
  }
  const report = buildSenderForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
