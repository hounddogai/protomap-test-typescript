import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCohortForecastEngine } from "./cohort-forecast-engine.js";
import { newCohortForecast } from "./cohort-forecast.js";

test("CohortForecastEngine keeps results within bounds", () => {
  const engine = defaultCohortForecastEngine();
  const item = newCohortForecast("code-522", "name-341");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
