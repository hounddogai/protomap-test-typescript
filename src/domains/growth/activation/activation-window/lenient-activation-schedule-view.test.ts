import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLenientActivationScheduleView,
  toLenientActivationScheduleViews,
} from "./lenient-activation-schedule-view.js";
import { newLenientActivationSchedule } from "./lenient-activation-schedule.js";

test("LenientActivationScheduleView shows the status in capitals", () => {
  const item = newLenientActivationSchedule("code-928", "title-993");
  const view = toLenientActivationScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientActivationScheduleViews([item, item]).length, 2, "views");
});
