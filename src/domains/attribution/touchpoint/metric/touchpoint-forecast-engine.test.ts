import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTouchpointForecastEngine } from "./touchpoint-forecast-engine.js";
import { newTouchpointForecast } from "./touchpoint-forecast.js";

test("TouchpointForecastEngine keeps results within bounds", () => {
  const engine = defaultTouchpointForecastEngine(flags.newRegistry());
  const item = newTouchpointForecast("code-147", "title-64");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
