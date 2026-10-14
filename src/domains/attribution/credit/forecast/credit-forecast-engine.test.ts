import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCreditForecastEngine } from "./credit-forecast-engine.js";
import { newCreditForecast } from "./credit-forecast.js";

test("CreditForecastEngine keeps results within bounds", () => {
  const engine = defaultCreditForecastEngine(flags.newRegistry());
  const item = newCreditForecast("code-905", "title-170");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
