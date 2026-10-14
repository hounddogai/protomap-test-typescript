import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredSubscriptionScheduleView,
  toTieredSubscriptionScheduleViews,
} from "./tiered-subscription-schedule-view.js";
import { newTieredSubscriptionSchedule } from "./tiered-subscription-schedule.js";

test("TieredSubscriptionScheduleView shows the status in capitals", () => {
  const item = newTieredSubscriptionSchedule("code-993", "label-136");
  const view = toTieredSubscriptionScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredSubscriptionScheduleViews([item, item]).length, 2, "views");
});
