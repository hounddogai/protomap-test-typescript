import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveLevelForecastEngine } from "./adaptive-level-forecast-engine.js";
import { newAdaptiveLevelForecast } from "./adaptive-level-forecast.js";

test("AdaptiveLevelForecastEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveLevelForecastEngine();
  const item = newAdaptiveLevelForecast("code-178", "name-9");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
