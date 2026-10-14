import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalWindowForecastEngine } from "./seasonal-window-forecast-engine.js";
import { newSeasonalWindowForecast } from "./seasonal-window-forecast.js";

test("SeasonalWindowForecastEngine keeps results within bounds", () => {
  const engine = defaultSeasonalWindowForecastEngine();
  const item = newSeasonalWindowForecast("code-259", "name-580");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
