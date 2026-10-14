import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredRetentionForecastEngine } from "./tiered-retention-forecast-engine.js";
import { newTieredRetentionForecast } from "./tiered-retention-forecast.js";

test("TieredRetentionForecastEngine keeps results within bounds", () => {
  const engine = defaultTieredRetentionForecastEngine();
  const item = newTieredRetentionForecast("code-545", "title-285");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
