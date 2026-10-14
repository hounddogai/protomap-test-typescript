import assert from "node:assert/strict";
import { test } from "node:test";
import { toInsightScheduleView, toInsightScheduleViews } from "./insight-schedule-view.js";
import { newInsightSchedule } from "./insight-schedule.js";

test("InsightScheduleView shows the status in capitals", () => {
  const item = newInsightSchedule("code-312", "label-698");
  const view = toInsightScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInsightScheduleViews([item, item]).length, 2, "views");
});
