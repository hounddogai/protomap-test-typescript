import assert from "node:assert/strict";
import { test } from "node:test";
import { toComplaintForecastView, toComplaintForecastViews } from "./complaint-forecast-view.js";
import { newComplaintForecast } from "./complaint-forecast.js";

test("ComplaintForecastView shows the status in capitals", () => {
  const item = newComplaintForecast("code-810", "label-957");
  const view = toComplaintForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toComplaintForecastViews([item, item]).length, 2, "views");
});
