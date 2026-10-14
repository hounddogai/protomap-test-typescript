import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDoubleOptInForecastEngine } from "./double-opt-in-forecast-engine.js";
import { newDoubleOptInForecast } from "./double-opt-in-forecast.js";

test("DoubleOptInForecastEngine keeps results within bounds", () => {
  const engine = defaultDoubleOptInForecastEngine();
  const item = newDoubleOptInForecast("code-272", "title-368");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
