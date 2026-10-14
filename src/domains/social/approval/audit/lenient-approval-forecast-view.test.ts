import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientApprovalForecastView, toLenientApprovalForecastViews } from "./lenient-approval-forecast-view.js";
import { newLenientApprovalForecast } from "./lenient-approval-forecast.js";

test("LenientApprovalForecastView shows the status in capitals", () => {
  const item = newLenientApprovalForecast("code-239", "name-510");
  const view = toLenientApprovalForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientApprovalForecastViews([item, item]).length, 2, "views");
});
