import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultEnrollmentForecastEngine } from "./enrollment-forecast-engine.js";
import { newEnrollmentForecast } from "./enrollment-forecast.js";

test("EnrollmentForecastEngine keeps results within bounds", () => {
  const engine = defaultEnrollmentForecastEngine(flags.newRegistry());
  const item = newEnrollmentForecast("code-415", "label-952");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
