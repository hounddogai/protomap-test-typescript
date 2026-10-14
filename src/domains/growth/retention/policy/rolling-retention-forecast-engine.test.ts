import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingRetentionForecastEngine } from "./rolling-retention-forecast-engine.js";
import { newRollingRetentionForecast } from "./rolling-retention-forecast.js";

test("RollingRetentionForecastEngine keeps results within bounds", () => {
  const engine = defaultRollingRetentionForecastEngine(flags.newRegistry());
  const item = newRollingRetentionForecast("code-786", "label-602");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
