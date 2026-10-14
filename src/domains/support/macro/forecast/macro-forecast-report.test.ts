import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMacroForecastReport } from "./macro-forecast-report.js";
import { MacroForecast, newMacroForecast } from "./macro-forecast.js";

test("MacroForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_399_635);
  const items: MacroForecast[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newMacroForecast(`macro-forecast-${index}`, "sample"));
  }
  const report = buildMacroForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
