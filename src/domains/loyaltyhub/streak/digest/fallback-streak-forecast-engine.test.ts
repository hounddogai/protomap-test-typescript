import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackStreakForecastEngine } from "./fallback-streak-forecast-engine.js";
import { newFallbackStreakForecast } from "./fallback-streak-forecast.js";

test("FallbackStreakForecastEngine keeps results within bounds", () => {
  const engine = defaultFallbackStreakForecastEngine();
  const item = newFallbackStreakForecast("code-397", "title-438");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
