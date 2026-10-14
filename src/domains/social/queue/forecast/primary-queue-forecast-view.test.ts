import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryQueueForecastView, toPrimaryQueueForecastViews } from "./primary-queue-forecast-view.js";
import { newPrimaryQueueForecast } from "./primary-queue-forecast.js";

test("PrimaryQueueForecastView shows the status in capitals", () => {
  const item = newPrimaryQueueForecast("code-987", "title-169");
  const view = toPrimaryQueueForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryQueueForecastViews([item, item]).length, 2, "views");
});
