import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSuppressionForecastEngine } from "./suppression-forecast-engine.js";
import { newSuppressionForecast } from "./suppression-forecast.js";

test("SuppressionForecastEngine keeps results within bounds", () => {
  const engine = defaultSuppressionForecastEngine(flags.newRegistry());
  const item = newSuppressionForecast("code-991", "title-14");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
