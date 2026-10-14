import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTierForecastEngine } from "./tier-forecast-engine.js";
import { newTierForecast } from "./tier-forecast.js";

test("TierForecastEngine keeps results within bounds", () => {
  const engine = defaultTierForecastEngine();
  const item = newTierForecast("code-246", "label-909");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
