import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalPaywallScheduleView, toSeasonalPaywallScheduleViews } from "./seasonal-paywall-schedule-view.js";
import { newSeasonalPaywallSchedule } from "./seasonal-paywall-schedule.js";

test("SeasonalPaywallScheduleView shows the status in capitals", () => {
  const item = newSeasonalPaywallSchedule("code-700", "label-497");
  const view = toSeasonalPaywallScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalPaywallScheduleViews([item, item]).length, 2, "views");
});
