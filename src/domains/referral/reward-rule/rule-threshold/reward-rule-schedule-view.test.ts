import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardRuleScheduleView, toRewardRuleScheduleViews } from "./reward-rule-schedule-view.js";
import { newRewardRuleSchedule } from "./reward-rule-schedule.js";

test("RewardRuleScheduleView shows the status in capitals", () => {
  const item = newRewardRuleSchedule("code-602", "name-349");
  const view = toRewardRuleScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardRuleScheduleViews([item, item]).length, 2, "views");
});
