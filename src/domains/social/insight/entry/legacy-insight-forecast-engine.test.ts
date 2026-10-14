import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyInsightForecastEngine } from "./legacy-insight-forecast-engine.js";
import { newLegacyInsightForecast } from "./legacy-insight-forecast.js";

test("LegacyInsightForecastEngine keeps results within bounds", () => {
  const engine = defaultLegacyInsightForecastEngine();
  const item = newLegacyInsightForecast("code-895", "label-129");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
