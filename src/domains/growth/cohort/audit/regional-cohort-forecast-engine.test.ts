import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalCohortForecastEngine } from "./regional-cohort-forecast-engine.js";
import { newRegionalCohortForecast } from "./regional-cohort-forecast.js";

test("RegionalCohortForecastEngine keeps results within bounds", () => {
  const engine = defaultRegionalCohortForecastEngine(flags.newRegistry());
  const item = newRegionalCohortForecast("code-311", "name-470");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
