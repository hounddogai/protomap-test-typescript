import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultExitRuleForecastReport } from "./default-exit-rule-forecast-report.js";
import { DefaultExitRuleForecast, newDefaultExitRuleForecast } from "./default-exit-rule-forecast.js";

test("DefaultExitRuleForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_721_535);
  const items: DefaultExitRuleForecast[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDefaultExitRuleForecast(`default-exit-rule-forecast-${index}`, "sample"));
  }
  const report = buildDefaultExitRuleForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
