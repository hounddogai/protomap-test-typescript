import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalCreativeForecastEngine } from "./global-creative-forecast-engine.js";
import { newGlobalCreativeForecast } from "./global-creative-forecast.js";

test("GlobalCreativeForecastEngine keeps results within bounds", () => {
  const engine = defaultGlobalCreativeForecastEngine(flags.newRegistry());
  const item = newGlobalCreativeForecast("code-192", "name-551");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
