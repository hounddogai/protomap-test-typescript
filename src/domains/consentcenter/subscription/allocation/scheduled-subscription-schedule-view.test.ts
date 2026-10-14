import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledSubscriptionScheduleView,
  toScheduledSubscriptionScheduleViews,
} from "./scheduled-subscription-schedule-view.js";
import { newScheduledSubscriptionSchedule } from "./scheduled-subscription-schedule.js";

test("ScheduledSubscriptionScheduleView shows the status in capitals", () => {
  const item = newScheduledSubscriptionSchedule("code-737", "title-415");
  const view = toScheduledSubscriptionScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledSubscriptionScheduleViews([item, item]).length, 2, "views");
});
