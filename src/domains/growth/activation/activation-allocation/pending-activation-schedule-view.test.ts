import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingActivationScheduleView,
  toPendingActivationScheduleViews,
} from "./pending-activation-schedule-view.js";
import { newPendingActivationSchedule } from "./pending-activation-schedule.js";

test("PendingActivationScheduleView shows the status in capitals", () => {
  const item = newPendingActivationSchedule("code-418", "label-117");
  const view = toPendingActivationScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingActivationScheduleViews([item, item]).length, 2, "views");
});
