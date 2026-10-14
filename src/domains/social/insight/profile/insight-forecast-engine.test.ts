import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultInsightForecastEngine } from "./insight-forecast-engine.js";
import { newInsightForecast } from "./insight-forecast.js";

test("InsightForecastEngine keeps results within bounds", () => {
  const engine = defaultInsightForecastEngine();
  const item = newInsightForecast("code-843", "name-429");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
