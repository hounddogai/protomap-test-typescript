import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsatScheduleView, toCsatScheduleViews } from "./csat-schedule-view.js";
import { newCsatSchedule } from "./csat-schedule.js";

test("CsatScheduleView shows the status in capitals", () => {
  const item = newCsatSchedule("code-563", "label-942");
  const view = toCsatScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCsatScheduleViews([item, item]).length, 2, "views");
});
