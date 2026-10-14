import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingCreativeForecastView, toPendingCreativeForecastViews } from "./pending-creative-forecast-view.js";
import { newPendingCreativeForecast } from "./pending-creative-forecast.js";

test("PendingCreativeForecastView shows the status in capitals", () => {
  const item = newPendingCreativeForecast("code-671", "title-400");
  const view = toPendingCreativeForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingCreativeForecastViews([item, item]).length, 2, "views");
});
