import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveMentionScheduleView, toAdaptiveMentionScheduleViews } from "./adaptive-mention-schedule-view.js";
import { newAdaptiveMentionSchedule } from "./adaptive-mention-schedule.js";

test("AdaptiveMentionScheduleView shows the status in capitals", () => {
  const item = newAdaptiveMentionSchedule("code-700", "label-823");
  const view = toAdaptiveMentionScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveMentionScheduleViews([item, item]).length, 2, "views");
});
