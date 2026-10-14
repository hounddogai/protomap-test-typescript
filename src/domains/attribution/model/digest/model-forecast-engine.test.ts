import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultModelForecastEngine } from "./model-forecast-engine.js";
import { newModelForecast } from "./model-forecast.js";

test("ModelForecastEngine keeps results within bounds", () => {
  const engine = defaultModelForecastEngine(flags.newRegistry());
  const item = newModelForecast("code-793", "name-852");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
