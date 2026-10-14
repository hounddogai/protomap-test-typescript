import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCreativeForecastEngine } from "./creative-forecast-engine.js";
import { newCreativeForecast } from "./creative-forecast.js";

test("CreativeForecastEngine keeps results within bounds", () => {
  const engine = defaultCreativeForecastEngine(flags.newRegistry());
  const item = newCreativeForecast("code-681", "name-261");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
