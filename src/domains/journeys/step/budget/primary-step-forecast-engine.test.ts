import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryStepForecastEngine } from "./primary-step-forecast-engine.js";
import { newPrimaryStepForecast } from "./primary-step-forecast.js";

test("PrimaryStepForecastEngine keeps results within bounds", () => {
  const engine = defaultPrimaryStepForecastEngine();
  const item = newPrimaryStepForecast("code-823", "name-536");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
