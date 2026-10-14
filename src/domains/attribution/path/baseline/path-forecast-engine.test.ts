import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPathForecastEngine } from "./path-forecast-engine.js";
import { newPathForecast } from "./path-forecast.js";

test("PathForecastEngine keeps results within bounds", () => {
  const engine = defaultPathForecastEngine();
  const item = newPathForecast("code-568", "name-146");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
