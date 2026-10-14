import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRewardForecastEngine } from "./reward-forecast-engine.js";
import { newRewardForecast } from "./reward-forecast.js";

test("RewardForecastEngine keeps results within bounds", () => {
  const engine = defaultRewardForecastEngine();
  const item = newRewardForecast("code-779", "title-807");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
