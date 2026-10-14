import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyNudgeForecastEngine } from "./legacy-nudge-forecast-engine.js";
import { newLegacyNudgeForecast } from "./legacy-nudge-forecast.js";

test("LegacyNudgeForecastEngine keeps results within bounds", () => {
  const engine = defaultLegacyNudgeForecastEngine();
  const item = newLegacyNudgeForecast("code-581", "label-166");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
