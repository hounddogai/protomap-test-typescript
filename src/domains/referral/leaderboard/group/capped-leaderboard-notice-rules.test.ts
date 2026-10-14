import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedLeaderboardNoticeBudgetRangeRule,
  CappedLeaderboardNoticeCodeLengthRule,
  CappedLeaderboardNoticeRequiredCodeRule,
  CappedLeaderboardNoticeVersionRangeRule,
  defaultCappedLeaderboardNoticeValidator,
} from "./capped-leaderboard-notice-rules.js";
import { newCappedLeaderboardNotice } from "./capped-leaderboard-notice.js";

test("CappedLeaderboardNoticeValidator reports every problem", () => {
  const validator = defaultCappedLeaderboardNoticeValidator();
  const item = newCappedLeaderboardNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedLeaderboardNoticeVersionRangeRule flags values above version", () => {
  const rule = new CappedLeaderboardNoticeVersionRangeRule(16, 3600);
  const item = newCappedLeaderboardNotice("x", "y");
  item.version = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedLeaderboardNoticeBudgetRangeRule flags values above budget", () => {
  const rule = new CappedLeaderboardNoticeBudgetRangeRule(2.8, 2622.9);
  const item = newCappedLeaderboardNotice("x", "y");
  item.budget = 2624.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedLeaderboardNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new CappedLeaderboardNoticeRequiredCodeRule("capped leaderboard notice needs a value");
  const item = newCappedLeaderboardNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedLeaderboardNoticeCodeLengthRule flags a long code", () => {
  const rule = new CappedLeaderboardNoticeCodeLengthRule(120);
  const item = newCappedLeaderboardNotice("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
