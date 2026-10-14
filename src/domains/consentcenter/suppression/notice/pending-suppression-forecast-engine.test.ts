import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingSuppressionForecastEngine } from "./pending-suppression-forecast-engine.js";
import { newPendingSuppressionForecast } from "./pending-suppression-forecast.js";

test("PendingSuppressionForecastEngine keeps results within bounds", () => {
  const engine = defaultPendingSuppressionForecastEngine();
  const item = newPendingSuppressionForecast("code-569", "title-155");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
