import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaForecastView, toSlaForecastViews } from "./sla-forecast-view.js";
import { newSlaForecast } from "./sla-forecast.js";

test("SlaForecastView shows the status in capitals", () => {
  const item = newSlaForecast("code-188", "title-11");
  const view = toSlaForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaForecastViews([item, item]).length, 2, "views");
});
