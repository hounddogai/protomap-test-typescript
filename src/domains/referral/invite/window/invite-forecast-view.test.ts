import assert from "node:assert/strict";
import { test } from "node:test";
import { toInviteForecastView, toInviteForecastViews } from "./invite-forecast-view.js";
import { newInviteForecast } from "./invite-forecast.js";

test("InviteForecastView shows the status in capitals", () => {
  const item = newInviteForecast("code-64", "title-428");
  const view = toInviteForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInviteForecastViews([item, item]).length, 2, "views");
});
