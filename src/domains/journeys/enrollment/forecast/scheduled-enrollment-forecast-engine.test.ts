import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledEnrollmentForecastEngine } from "./scheduled-enrollment-forecast-engine.js";
import { newScheduledEnrollmentForecast } from "./scheduled-enrollment-forecast.js";

test("ScheduledEnrollmentForecastEngine keeps results within bounds", () => {
  const engine = defaultScheduledEnrollmentForecastEngine();
  const item = newScheduledEnrollmentForecast("code-782", "label-321");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
