import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalReplyScheduleView, toRegionalReplyScheduleViews } from "./regional-reply-schedule-view.js";
import { newRegionalReplySchedule } from "./regional-reply-schedule.js";

test("RegionalReplyScheduleView shows the status in capitals", () => {
  const item = newRegionalReplySchedule("code-724", "title-153");
  const view = toRegionalReplyScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalReplyScheduleViews([item, item]).length, 2, "views");
});
