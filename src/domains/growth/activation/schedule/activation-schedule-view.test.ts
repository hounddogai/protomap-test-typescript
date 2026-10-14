import assert from "node:assert/strict";
import { test } from "node:test";
import { toActivationScheduleView, toActivationScheduleViews } from "./activation-schedule-view.js";
import { newActivationSchedule } from "./activation-schedule.js";

test("ActivationScheduleView shows the status in capitals", () => {
  const item = newActivationSchedule("code-884", "label-712");
  const view = toActivationScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toActivationScheduleViews([item, item]).length, 2, "views");
});
