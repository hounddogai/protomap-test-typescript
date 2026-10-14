import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingStepForecastView, toRollingStepForecastViews } from "./rolling-step-forecast-view.js";
import { newRollingStepForecast } from "./rolling-step-forecast.js";

test("RollingStepForecastView shows the status in capitals", () => {
  const item = newRollingStepForecast("code-955", "label-169");
  const view = toRollingStepForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingStepForecastViews([item, item]).length, 2, "views");
});
