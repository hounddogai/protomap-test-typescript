import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRedemptionForecastEngine } from "./redemption-forecast-engine.js";
import { newRedemptionForecast } from "./redemption-forecast.js";

test("RedemptionForecastEngine keeps results within bounds", () => {
  const engine = defaultRedemptionForecastEngine(flags.newRegistry());
  const item = newRedemptionForecast("code-885", "name-745");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
