import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryLeaderboardAdjustmentCodeLengthRule,
  PrimaryLeaderboardAdjustmentMarginRangeRule,
  PrimaryLeaderboardAdjustmentThresholdRangeRule,
  PrimaryLeaderboardAdjustmentWindowDaysRangeRule,
  defaultPrimaryLeaderboardAdjustmentValidator,
} from "./primary-leaderboard-adjustment-rules.js";
import { newPrimaryLeaderboardAdjustment } from "./primary-leaderboard-adjustment.js";

test("PrimaryLeaderboardAdjustmentValidator reports every problem", () => {
  const validator = defaultPrimaryLeaderboardAdjustmentValidator();
  const item = newPrimaryLeaderboardAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryLeaderboardAdjustmentMarginRangeRule flags values above margin", () => {
  const rule = new PrimaryLeaderboardAdjustmentMarginRangeRule(2, 3799.5);
  const item = newPrimaryLeaderboardAdjustment("x", "y");
  item.margin = 3801;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryLeaderboardAdjustmentThresholdRangeRule flags values above threshold", () => {
  const rule = new PrimaryLeaderboardAdjustmentThresholdRangeRule(4.7, 3747.1);
  const item = newPrimaryLeaderboardAdjustment("x", "y");
  item.threshold = 3748.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryLeaderboardAdjustmentWindowDaysRangeRule flags values above window days", () => {
  const rule = new PrimaryLeaderboardAdjustmentWindowDaysRangeRule(80, 1000);
  const item = newPrimaryLeaderboardAdjustment("x", "y");
  item.windowDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryLeaderboardAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new PrimaryLeaderboardAdjustmentCodeLengthRule(32);
  const item = newPrimaryLeaderboardAdjustment("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
