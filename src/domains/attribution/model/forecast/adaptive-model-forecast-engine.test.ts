import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveModelForecastEngine } from "./adaptive-model-forecast-engine.js";
import { newAdaptiveModelForecast } from "./adaptive-model-forecast.js";

test("AdaptiveModelForecastEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveModelForecastEngine();
  const item = newAdaptiveModelForecast("code-979", "label-841");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
