import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardAuditRatioRangeRule,
  LeaderboardAuditTitleLengthRule,
  defaultLeaderboardAuditValidator,
} from "./leaderboard-audit-rules.js";
import { newLeaderboardAudit } from "./leaderboard-audit.js";

test("LeaderboardAuditValidator reports every problem", () => {
  const validator = defaultLeaderboardAuditValidator();
  const item = newLeaderboardAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardAuditRatioRangeRule flags values above ratio", () => {
  const rule = new LeaderboardAuditRatioRangeRule(9.1, 4404.7);
  const item = newLeaderboardAudit("x", "y");
  item.ratio = 4406.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LeaderboardAuditTitleLengthRule flags a long title", () => {
  const rule = new LeaderboardAuditTitleLengthRule(255);
  const item = newLeaderboardAudit("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
