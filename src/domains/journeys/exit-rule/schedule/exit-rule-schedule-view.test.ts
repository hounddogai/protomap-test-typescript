import assert from "node:assert/strict";
import { test } from "node:test";
import { toExitRuleScheduleView, toExitRuleScheduleViews } from "./exit-rule-schedule-view.js";
import { newExitRuleSchedule } from "./exit-rule-schedule.js";

test("ExitRuleScheduleView shows the status in capitals", () => {
  const item = newExitRuleSchedule("code-638", "label-911");
  const view = toExitRuleScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toExitRuleScheduleViews([item, item]).length, 2, "views");
});
