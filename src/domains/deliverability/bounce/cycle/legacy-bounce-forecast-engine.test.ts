import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyBounceForecastEngine } from "./legacy-bounce-forecast-engine.js";
import { newLegacyBounceForecast } from "./legacy-bounce-forecast.js";

test("LegacyBounceForecastEngine keeps results within bounds", () => {
  const engine = defaultLegacyBounceForecastEngine(flags.newRegistry());
  const item = newLegacyBounceForecast("code-507", "name-525");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
