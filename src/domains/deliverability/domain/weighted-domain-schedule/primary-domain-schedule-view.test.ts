import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryDomainScheduleView, toPrimaryDomainScheduleViews } from "./primary-domain-schedule-view.js";
import { newPrimaryDomainSchedule } from "./primary-domain-schedule.js";

test("PrimaryDomainScheduleView shows the status in capitals", () => {
  const item = newPrimaryDomainSchedule("code-831", "title-374");
  const view = toPrimaryDomainScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryDomainScheduleViews([item, item]).length, 2, "views");
});
