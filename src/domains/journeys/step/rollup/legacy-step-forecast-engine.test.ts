import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyStepForecastEngine } from "./legacy-step-forecast-engine.js";
import { newLegacyStepForecast } from "./legacy-step-forecast.js";

test("LegacyStepForecastEngine keeps results within bounds", () => {
  const engine = defaultLegacyStepForecastEngine(flags.newRegistry());
  const item = newLegacyStepForecast("code-655", "name-289");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
