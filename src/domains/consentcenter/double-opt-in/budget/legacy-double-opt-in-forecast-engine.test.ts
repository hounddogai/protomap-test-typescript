import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyDoubleOptInForecastEngine } from "./legacy-double-opt-in-forecast-engine.js";
import { newLegacyDoubleOptInForecast } from "./legacy-double-opt-in-forecast.js";

test("LegacyDoubleOptInForecastEngine keeps results within bounds", () => {
  const engine = defaultLegacyDoubleOptInForecastEngine(flags.newRegistry());
  const item = newLegacyDoubleOptInForecast("code-626", "title-636");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
