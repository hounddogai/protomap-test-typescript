import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultSlaForecastEngine } from "./default-sla-forecast-engine.js";
import { newDefaultSlaForecast } from "./default-sla-forecast.js";

test("DefaultSlaForecastEngine keeps results within bounds", () => {
  const engine = defaultDefaultSlaForecastEngine();
  const item = newDefaultSlaForecast("code-501", "label-383");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
