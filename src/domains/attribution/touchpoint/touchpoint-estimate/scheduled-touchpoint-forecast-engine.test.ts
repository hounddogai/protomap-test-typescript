import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledTouchpointForecastEngine } from "./scheduled-touchpoint-forecast-engine.js";
import { newScheduledTouchpointForecast } from "./scheduled-touchpoint-forecast.js";

test("ScheduledTouchpointForecastEngine keeps results within bounds", () => {
  const engine = defaultScheduledTouchpointForecastEngine(flags.newRegistry());
  const item = newScheduledTouchpointForecast("code-353", "label-527");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
