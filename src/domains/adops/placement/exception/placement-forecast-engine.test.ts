import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPlacementForecastEngine } from "./placement-forecast-engine.js";
import { newPlacementForecast } from "./placement-forecast.js";

test("PlacementForecastEngine keeps results within bounds", () => {
  const engine = defaultPlacementForecastEngine(flags.newRegistry());
  const item = newPlacementForecast("code-22", "title-254");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
