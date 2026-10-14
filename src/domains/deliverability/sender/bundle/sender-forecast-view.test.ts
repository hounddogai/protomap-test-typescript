import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderForecastView, toSenderForecastViews } from "./sender-forecast-view.js";
import { newSenderForecast } from "./sender-forecast.js";

test("SenderForecastView shows the status in capitals", () => {
  const item = newSenderForecast("code-686", "name-217");
  const view = toSenderForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderForecastViews([item, item]).length, 2, "views");
});
