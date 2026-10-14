import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEscalationForecastReport } from "./escalation-forecast-report.js";
import { EscalationForecast, newEscalationForecast } from "./escalation-forecast.js";

test("EscalationForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_817_639);
  const items: EscalationForecast[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newEscalationForecast(`escalation-forecast-${index}`, "sample"));
  }
  const report = buildEscalationForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
