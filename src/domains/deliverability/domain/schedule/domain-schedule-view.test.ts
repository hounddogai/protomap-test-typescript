import assert from "node:assert/strict";
import { test } from "node:test";
import { toDomainScheduleView, toDomainScheduleViews } from "./domain-schedule-view.js";
import { newDomainSchedule } from "./domain-schedule.js";

test("DomainScheduleView shows the status in capitals", () => {
  const item = newDomainSchedule("code-854", "label-682");
  const view = toDomainScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDomainScheduleViews([item, item]).length, 2, "views");
});
