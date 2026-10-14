import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingSuppressionForecastView,
  toPendingSuppressionForecastViews,
} from "./pending-suppression-forecast-view.js";
import { newPendingSuppressionForecast } from "./pending-suppression-forecast.js";

test("PendingSuppressionForecastView shows the status in capitals", () => {
  const item = newPendingSuppressionForecast("code-569", "title-155");
  const view = toPendingSuppressionForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingSuppressionForecastViews([item, item]).length, 2, "views");
});
