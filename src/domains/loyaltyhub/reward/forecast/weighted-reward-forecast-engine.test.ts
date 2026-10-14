import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedRewardForecastEngine } from "./weighted-reward-forecast-engine.js";
import { newWeightedRewardForecast } from "./weighted-reward-forecast.js";

test("WeightedRewardForecastEngine keeps results within bounds", () => {
  const engine = defaultWeightedRewardForecastEngine(flags.newRegistry());
  const item = newWeightedRewardForecast("code-922", "label-427");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
