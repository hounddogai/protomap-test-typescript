import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWarmupForecastEngine } from "./warmup-forecast-engine.js";
import { newWarmupForecast } from "./warmup-forecast.js";

test("WarmupForecastEngine keeps results within bounds", () => {
  const engine = defaultWarmupForecastEngine(flags.newRegistry());
  const item = newWarmupForecast("code-599", "label-588");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
