import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingCreativeForecastEngine } from "./pending-creative-forecast-engine.js";
import { newPendingCreativeForecast } from "./pending-creative-forecast.js";

test("PendingCreativeForecastEngine keeps results within bounds", () => {
  const engine = defaultPendingCreativeForecastEngine(flags.newRegistry());
  const item = newPendingCreativeForecast("code-671", "title-400");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
