import assert from "node:assert/strict";
import { test } from "node:test";
import { toEnrollmentForecastView, toEnrollmentForecastViews } from "./enrollment-forecast-view.js";
import { newEnrollmentForecast } from "./enrollment-forecast.js";

test("EnrollmentForecastView shows the status in capitals", () => {
  const item = newEnrollmentForecast("code-415", "label-952");
  const view = toEnrollmentForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEnrollmentForecastViews([item, item]).length, 2, "views");
});
