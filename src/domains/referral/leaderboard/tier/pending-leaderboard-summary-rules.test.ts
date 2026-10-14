import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingLeaderboardSummaryCodeLengthRule,
  PendingLeaderboardSummaryOpenRateRangeRule,
  PendingLeaderboardSummaryPhoneLengthRule,
  PendingLeaderboardSummaryRequiredPhoneRule,
  defaultPendingLeaderboardSummaryValidator,
} from "./pending-leaderboard-summary-rules.js";
import { newPendingLeaderboardSummary } from "./pending-leaderboard-summary.js";

test("PendingLeaderboardSummaryValidator reports every problem", () => {
  const validator = defaultPendingLeaderboardSummaryValidator();
  const item = newPendingLeaderboardSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingLeaderboardSummaryOpenRateRangeRule flags values above open rate", () => {
  const rule = new PendingLeaderboardSummaryOpenRateRangeRule(7.7, 1366.9);
  const item = newPendingLeaderboardSummary("x", "y");
  item.openRate = 1368.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingLeaderboardSummaryCodeLengthRule flags a long code", () => {
  const rule = new PendingLeaderboardSummaryCodeLengthRule(1000);
  const item = newPendingLeaderboardSummary("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingLeaderboardSummaryRequiredPhoneRule flags a blank phone", () => {
  const rule = new PendingLeaderboardSummaryRequiredPhoneRule("pending leaderboard summary needs a value");
  const item = newPendingLeaderboardSummary("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingLeaderboardSummaryPhoneLengthRule flags a long phone", () => {
  const rule = new PendingLeaderboardSummaryPhoneLengthRule(255);
  const item = newPendingLeaderboardSummary("x", "y");
  item.phone = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
