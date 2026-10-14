import assert from "node:assert/strict";
import { test } from "node:test";
import { toSubscriptionScheduleView, toSubscriptionScheduleViews } from "./subscription-schedule-view.js";
import { newSubscriptionSchedule } from "./subscription-schedule.js";

test("SubscriptionScheduleView shows the status in capitals", () => {
  const item = newSubscriptionSchedule("code-128", "title-874");
  const view = toSubscriptionScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSubscriptionScheduleViews([item, item]).length, 2, "views");
});
