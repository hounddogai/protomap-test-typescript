import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackDomainScheduleView, toFallbackDomainScheduleViews } from "./fallback-domain-schedule-view.js";
import { newFallbackDomainSchedule } from "./fallback-domain-schedule.js";

test("FallbackDomainScheduleView shows the status in capitals", () => {
  const item = newFallbackDomainSchedule("code-922", "label-959");
  const view = toFallbackDomainScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackDomainScheduleViews([item, item]).length, 2, "views");
});
