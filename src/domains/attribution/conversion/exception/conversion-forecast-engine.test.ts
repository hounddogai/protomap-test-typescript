import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultConversionForecastEngine } from "./conversion-forecast-engine.js";
import { newConversionForecast } from "./conversion-forecast.js";

test("ConversionForecastEngine keeps results within bounds", () => {
  const engine = defaultConversionForecastEngine(flags.newRegistry());
  const item = newConversionForecast("code-98", "label-505");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
