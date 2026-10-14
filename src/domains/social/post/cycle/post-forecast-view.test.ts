import assert from "node:assert/strict";
import { test } from "node:test";
import { toPostForecastView, toPostForecastViews } from "./post-forecast-view.js";
import { newPostForecast } from "./post-forecast.js";

test("PostForecastView shows the status in capitals", () => {
  const item = newPostForecast("code-50", "label-496");
  const view = toPostForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPostForecastViews([item, item]).length, 2, "views");
});
