import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingSuppressionForecastEngine } from "./rolling-suppression-forecast-engine.js";
import { newRollingSuppressionForecast } from "./rolling-suppression-forecast.js";

test("RollingSuppressionForecastEngine keeps results within bounds", () => {
  const engine = defaultRollingSuppressionForecastEngine();
  const item = newRollingSuppressionForecast("code-770", "label-83");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
