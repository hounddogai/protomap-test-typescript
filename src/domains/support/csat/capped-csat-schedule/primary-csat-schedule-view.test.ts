import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryCsatScheduleView, toPrimaryCsatScheduleViews } from "./primary-csat-schedule-view.js";
import { newPrimaryCsatSchedule } from "./primary-csat-schedule.js";

test("PrimaryCsatScheduleView shows the status in capitals", () => {
  const item = newPrimaryCsatSchedule("code-200", "name-262");
  const view = toPrimaryCsatScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryCsatScheduleViews([item, item]).length, 2, "views");
});
