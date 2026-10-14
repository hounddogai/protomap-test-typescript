import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPacingForecastEngine } from "./pacing-forecast-engine.js";
import { newPacingForecast } from "./pacing-forecast.js";

test("PacingForecastEngine keeps results within bounds", () => {
  const engine = defaultPacingForecastEngine(flags.newRegistry());
  const item = newPacingForecast("code-705", "label-537");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
