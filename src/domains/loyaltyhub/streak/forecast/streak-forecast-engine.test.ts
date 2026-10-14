import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStreakForecastEngine } from "./streak-forecast-engine.js";
import { newStreakForecast } from "./streak-forecast.js";

test("StreakForecastEngine keeps results within bounds", () => {
  const engine = defaultStreakForecastEngine(flags.newRegistry());
  const item = newStreakForecast("code-247", "title-354");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
