import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLegacyRewardRuleScheduleView,
  toLegacyRewardRuleScheduleViews,
} from "./legacy-reward-rule-schedule-view.js";
import { newLegacyRewardRuleSchedule } from "./legacy-reward-rule-schedule.js";

test("LegacyRewardRuleScheduleView shows the status in capitals", () => {
  const item = newLegacyRewardRuleSchedule("code-234", "title-819");
  const view = toLegacyRewardRuleScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyRewardRuleScheduleViews([item, item]).length, 2, "views");
});
