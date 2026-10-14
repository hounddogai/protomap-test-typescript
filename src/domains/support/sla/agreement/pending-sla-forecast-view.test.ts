import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingSlaForecastView, toPendingSlaForecastViews } from "./pending-sla-forecast-view.js";
import { newPendingSlaForecast } from "./pending-sla-forecast.js";

test("PendingSlaForecastView shows the status in capitals", () => {
  const item = newPendingSlaForecast("code-529", "name-459");
  const view = toPendingSlaForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingSlaForecastViews([item, item]).length, 2, "views");
});
