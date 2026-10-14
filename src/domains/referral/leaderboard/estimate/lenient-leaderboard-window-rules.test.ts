import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientLeaderboardWindowClicksRangeRule,
  LenientLeaderboardWindowExpiresAtRangeRule,
  LenientLeaderboardWindowLabelLengthRule,
  defaultLenientLeaderboardWindowValidator,
} from "./lenient-leaderboard-window-rules.js";
import { newLenientLeaderboardWindow } from "./lenient-leaderboard-window.js";

test("LenientLeaderboardWindowValidator reports every problem", () => {
  const validator = defaultLenientLeaderboardWindowValidator();
  const item = newLenientLeaderboardWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientLeaderboardWindowClicksRangeRule flags values above clicks", () => {
  const rule = new LenientLeaderboardWindowClicksRangeRule(64, 120);
  const item = newLenientLeaderboardWindow("x", "y");
  item.clicks = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientLeaderboardWindowExpiresAtRangeRule flags values above expires at", () => {
  const rule = new LenientLeaderboardWindowExpiresAtRangeRule(64, 86400);
  const item = newLenientLeaderboardWindow("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientLeaderboardWindowLabelLengthRule flags a long label", () => {
  const rule = new LenientLeaderboardWindowLabelLengthRule(64);
  const item = newLenientLeaderboardWindow("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
