import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFraudCheckForecastEngine } from "./fraud-check-forecast-engine.js";
import { newFraudCheckForecast } from "./fraud-check-forecast.js";

test("FraudCheckForecastEngine keeps results within bounds", () => {
  const engine = defaultFraudCheckForecastEngine();
  const item = newFraudCheckForecast("code-561", "name-618");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
