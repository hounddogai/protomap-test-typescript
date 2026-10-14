import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPrimaryTicketViewScheduleView,
  toPrimaryTicketViewScheduleViews,
} from "./primary-ticket-view-schedule-view.js";
import { newPrimaryTicketViewSchedule } from "./primary-ticket-view-schedule.js";

test("PrimaryTicketViewScheduleView shows the status in capitals", () => {
  const item = newPrimaryTicketViewSchedule("code-730", "label-769");
  const view = toPrimaryTicketViewScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryTicketViewScheduleViews([item, item]).length, 2, "views");
});
