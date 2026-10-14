import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultSlaForecastView, toDefaultSlaForecastViews } from "./default-sla-forecast-view.js";
import { newDefaultSlaForecast } from "./default-sla-forecast.js";

test("DefaultSlaForecastView shows the status in capitals", () => {
  const item = newDefaultSlaForecast("code-501", "label-383");
  const view = toDefaultSlaForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultSlaForecastViews([item, item]).length, 2, "views");
});
