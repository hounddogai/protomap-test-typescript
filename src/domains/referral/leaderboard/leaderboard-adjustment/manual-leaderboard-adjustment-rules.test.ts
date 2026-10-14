import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualLeaderboardAdjustmentAmountRangeRule,
  defaultManualLeaderboardAdjustmentValidator,
} from "./manual-leaderboard-adjustment-rules.js";
import { newManualLeaderboardAdjustment } from "./manual-leaderboard-adjustment.js";

test("ManualLeaderboardAdjustmentValidator reports every problem", () => {
  const validator = defaultManualLeaderboardAdjustmentValidator();
  const item = newManualLeaderboardAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualLeaderboardAdjustmentAmountRangeRule flags values above amount", () => {
  const rule = new ManualLeaderboardAdjustmentAmountRangeRule(0.1, 4060.8);
  const item = newManualLeaderboardAdjustment("x", "y");
  item.amount = 4062.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
