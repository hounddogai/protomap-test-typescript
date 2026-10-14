import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryBadgeForecastEngine } from "./primary-badge-forecast-engine.js";
import { newPrimaryBadgeForecast } from "./primary-badge-forecast.js";

test("PrimaryBadgeForecastEngine keeps results within bounds", () => {
  const engine = defaultPrimaryBadgeForecastEngine();
  const item = newPrimaryBadgeForecast("code-571", "title-733");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
