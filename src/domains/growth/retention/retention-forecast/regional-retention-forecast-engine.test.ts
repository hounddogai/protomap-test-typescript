import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalRetentionForecastEngine } from "./regional-retention-forecast-engine.js";
import { newRegionalRetentionForecast } from "./regional-retention-forecast.js";

test("RegionalRetentionForecastEngine keeps results within bounds", () => {
  const engine = defaultRegionalRetentionForecastEngine(flags.newRegistry());
  const item = newRegionalRetentionForecast("code-796", "label-313");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
