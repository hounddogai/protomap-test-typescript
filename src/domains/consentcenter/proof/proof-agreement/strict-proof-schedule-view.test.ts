import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictProofScheduleView, toStrictProofScheduleViews } from "./strict-proof-schedule-view.js";
import { newStrictProofSchedule } from "./strict-proof-schedule.js";

test("StrictProofScheduleView shows the status in capitals", () => {
  const item = newStrictProofSchedule("code-404", "label-459");
  const view = toStrictProofScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictProofScheduleViews([item, item]).length, 2, "views");
});
